import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import { styles, exteriorStyles } from "@/lib/demo";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const NUMBER_OF_DESIGNS = 3;

const CLOUDFLARE_MODEL =
  "@cf/black-forest-labs/flux-2-klein-4b";

const INTERIOR_STYLES = styles.map((style) => style.id);

const EXTERIOR_STYLES = exteriorStyles.map(
  (style) => style.id
);

const INTERIOR_VARIATIONS = [
  "Keep the existing room layout and architecture. Create a refined, realistic interior redesign with improved furniture, materials, lighting, colors, and decor.",

  "Preserve the room structure, doors, windows, walls, ceiling, and camera perspective. Create a fresh professional interior design while keeping the result highly realistic.",

  "Transform the room into a polished professionally designed space. Keep the original architecture and proportions intact while updating furniture, finishes, lighting, and styling.",

  "Create a sophisticated interior redesign based on the selected style. Preserve the original room geometry and viewpoint while making the furniture, materials, colors, and decor cohesive.",

  "Produce a realistic high-end interior design visualization. Maintain the original architecture and spatial layout while introducing carefully selected furniture, lighting, textures, and decorative elements.",
];

const EXTERIOR_VARIATIONS = [
  "Keep the existing building architecture, proportions, roof shape, windows, doors, and camera perspective. Redesign the exterior with improved materials, colors, landscaping, lighting, and outdoor elements.",

  "Preserve the original structure and geometry of the building. Create a realistic professional exterior redesign using the selected architectural style, with cohesive materials, landscaping, and outdoor details.",

  "Transform the property into a polished professionally designed exterior. Keep the original building proportions and major architectural features while updating facade materials, colors, landscaping, and outdoor spaces.",

  "Create a realistic architectural exterior visualization based on the selected style. Preserve the existing building footprint and viewpoint while improving the facade, landscaping, lighting, paths, and outdoor furniture where appropriate.",

  "Produce a high-end realistic exterior redesign. Maintain the original structure and perspective while introducing coordinated facade finishes, windows, doors, landscaping, lighting, and outdoor architectural details.",
];

function isValidPlan(plan: string): plan is Plan {
  return (
    plan === "free" ||
    plan === "basic" ||
    plan === "pro"
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to generate redesign.";
}

export async function POST(request: NextRequest) {
  let reservedGeneration = false;
  let reservedUserId: string | null = null;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to generate a redesign.",
        },
        { status: 401 }
      );
    }

    const accountId =
      process.env.CLOUDFLARE_ACCOUNT_ID;

    const apiToken =
      process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.error(
        "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN."
      );

      return NextResponse.json(
        {
          error:
            "Cloudflare AI is not configured correctly.",
        },
        { status: 500 }
      );
    }

    /*
     * ---------------------------------------------------------
     * Read request data BEFORE reserving a generation.
     * ---------------------------------------------------------
     */

    const formData = await request.formData();

    const image = formData.get("image");

    const style = String(
      formData.get("style") || ""
    ).trim();

    const room = String(
      formData.get("room") || ""
    ).trim();

    const preserve = String(
      formData.get("preserve") || "Structure"
    ).trim();

    const creativity = String(
      formData.get("creativity") || "Balanced"
    ).trim();

    const additionalPrompt = String(
      formData.get("additionalPrompt") || ""
    ).trim();

    const typeValue = String(
      formData.get("type") || "interior"
    ).trim();

    const spaceType =
      typeValue === "exterior"
        ? "exterior"
        : "interior";

    /*
     * ---------------------------------------------------------
     * Validate image
     * ---------------------------------------------------------
     */

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          error: "Please upload an image.",
        },
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error:
            "The uploaded file must be an image.",
        },
        { status: 400 }
      );
    }

    if (image.size === 0) {
      return NextResponse.json(
        {
          error:
            "The uploaded image is empty.",
        },
        { status: 400 }
      );
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "The uploaded image must be smaller than 10 MB.",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * Validate style
     * ---------------------------------------------------------
     */

    if (!style) {
      return NextResponse.json(
        {
          error:
            "Please select a design style.",
        },
        { status: 400 }
      );
    }

    const styleList =
      spaceType === "exterior"
        ? EXTERIOR_STYLES
        : INTERIOR_STYLES;

    if (!styleList.includes(style)) {
      return NextResponse.json(
        {
          error: "Invalid design style.",
        },
        { status: 400 }
      );
    }

    const styleIndex =
      styleList.indexOf(style);

    /*
     * ---------------------------------------------------------
     * Get / create database user
     * ---------------------------------------------------------
     */

    let user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          plan: "free",
          generationsUsed: 0,
        },
      });
    }

    const plan = user.plan;

    if (!isValidPlan(plan)) {
      return NextResponse.json(
        {
          error: "Invalid account plan.",
        },
        { status: 500 }
      );
    }

    const limits = PLAN_LIMITS[plan];

    /*
     * ---------------------------------------------------------
     * Admin
     * ---------------------------------------------------------
     */

    const admin = await isAdmin(userId);

    /*
     * Admin:
     * - unlimited generations
     * - all 20 interior styles
     * - all 20 exterior styles
     *
     * Normal users:
     * - limited by their plan
     */

    if (!admin && styleIndex >= limits.designs) {
      return NextResponse.json(
        {
          error:
            `This design style is not available on the ${plan} plan.`,
          plan,
          generationsUsed:
            user.generationsUsed,
          generationsLimit:
            limits.generations,
          remaining: Math.max(
            limits.generations -
              user.generationsUsed,
            0
          ),
          designsPerGeneration:
            limits.designs,
          isAdmin: false,
        },
        { status: 403 }
      );
    }

    /*
     * ---------------------------------------------------------
     * Reserve one generation
     * ---------------------------------------------------------
     *
     * Admin does NOT consume a generation limit.
     *
     * We still increment generationsUsed for admin so the
     * database keeps a total count of how many generations
     * the admin account has performed.
     * ---------------------------------------------------------
     */

    const reservation = admin
      ? await prisma.user.updateMany({
          where: {
            clerkUserId: userId,
          },
          data: {
            generationsUsed: {
              increment: 1,
            },
          },
        })
      : await prisma.user.updateMany({
          where: {
            clerkUserId: userId,
            generationsUsed: {
              lt: limits.generations,
            },
          },
          data: {
            generationsUsed: {
              increment: 1,
            },
          },
        });

    if (reservation.count !== 1) {
      return NextResponse.json(
        {
          error:
            `You have reached your ${plan} plan generation limit.`,
          plan,
          generationsUsed:
            user.generationsUsed,
          generationsLimit:
            limits.generations,
          remaining: 0,
          designsPerGeneration:
            limits.designs,
          isAdmin: false,
        },
        { status: 403 }
      );
    }

    reservedGeneration = true;
    reservedUserId = userId;

    /*
     * ---------------------------------------------------------
     * Get updated usage
     * ---------------------------------------------------------
     */

    const updatedUser =
      await prisma.user.findUnique({
        where: {
          clerkUserId: userId,
        },
      });

    if (!updatedUser) {
      throw new Error(
        "User disappeared after generation reservation."
      );
    }

    const generationsUsed =
      updatedUser.generationsUsed;

    const remaining = admin
      ? null
      : Math.max(
          limits.generations -
            generationsUsed,
          0
        );

    /*
     * ---------------------------------------------------------
     * Build prompts
     * ---------------------------------------------------------
     */

    const variations =
      spaceType === "exterior"
        ? EXTERIOR_VARIATIONS
        : INTERIOR_VARIATIONS;

    const prompts = Array.from(
      {
        length: NUMBER_OF_DESIGNS,
      },
      (_, index) => {
        const variation =
          variations[
            index % variations.length
          ];

        const basePrompt =
          spaceType === "exterior"
            ? `
Create a photorealistic exterior redesign of the provided property.

Property type:
${room || "House Exterior"}

Selected architectural style:
${style}

Preserve:
${preserve}

Creativity:
${creativity}

${variation}

IMPORTANT:

- Preserve the original building footprint.
- Preserve the main architecture and proportions.
- Preserve the original camera viewpoint and perspective.
- Do not randomly move or remove doors and windows.
- Do not change the building into a different type of property.
- Keep the result believable and architecturally realistic.
- Maintain realistic materials, lighting, shadows, scale, and perspective.
- Improve the facade, colors, materials, landscaping, paths, outdoor furniture, and exterior details where appropriate.
- Do not add unrealistic objects.
`
            : `
Create a photorealistic interior redesign of the provided room.

Room:
${room || "Living Room"}

Selected interior design style:
${style}

Preserve:
${preserve}

Creativity:
${creativity}

${variation}

IMPORTANT:

- Preserve the existing room geometry.
- Preserve walls, windows, doors, ceiling height, and major architectural elements.
- Preserve the original camera viewpoint and perspective.
- Do not change the room into another room type.
- Keep the result realistic and physically believable.
- Maintain realistic scale, lighting, shadows, materials, and perspective.
- Replace or improve furniture, colors, finishes, lighting, textiles, and decor according to the selected style.
`;

        const extra =
          additionalPrompt.length > 0
            ? `
Additional user instructions:

${additionalPrompt}
`
            : "";

        return `${basePrompt}${extra}

Generate a high-quality professional architectural visualization.

Photorealistic.

Natural lighting.

Realistic materials.

Realistic proportions.

No text.

No logos.

No watermark.
`;
      }
    );

    /*
     * ---------------------------------------------------------
     * Convert uploaded image to binary
     * ---------------------------------------------------------
     */

    const imageBuffer =
      await image.arrayBuffer();

    /*
     * ---------------------------------------------------------
     * Cloudflare generation
     * ---------------------------------------------------------
     */

    const generateDesign = async (
      prompt: string
    ): Promise<string> => {
      const cloudflareForm =
        new FormData();

      cloudflareForm.append(
        "prompt",
        prompt
      );

      cloudflareForm.append(
        "input_image_0",
        new Blob(
          [imageBuffer],
          {
            type:
              image.type ||
              "image/jpeg",
          }
        ),
        image.name ||
          "roomly-input.jpg"
      );

      cloudflareForm.append(
        "width",
        "1920"
      );

      cloudflareForm.append(
        "height",
        "1080"
      );

      const cloudflareUrl =
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`;

      const response = await fetch(
        cloudflareUrl,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiToken}`,
          },

          /*
           * IMPORTANT:
           *
           * Do NOT manually set Content-Type.
           *
           * fetch() automatically creates:
           *
           * multipart/form-data;
           * boundary=...
           */
          body: cloudflareForm,
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `Cloudflare AI request failed (${response.status}): ${errorText}`
        );
      }

      /*
       * -------------------------------------------------------
       * JSON response
       * -------------------------------------------------------
       */

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        const data =
          await response.json();

        if (data?.success === false) {
          throw new Error(
            data?.errors?.[0]
              ?.message ||
              "Cloudflare AI generation failed."
          );
        }

        const imageResult =
          data?.result?.image;

        if (!imageResult) {
          throw new Error(
            "Cloudflare returned no generated image."
          );
        }

        if (
          typeof imageResult ===
            "string" &&
          imageResult.startsWith(
            "data:image/"
          )
        ) {
          return imageResult;
        }

        if (
          typeof imageResult ===
          "string"
        ) {
          return `data:image/png;base64,${imageResult}`;
        }

        if (
          Array.isArray(imageResult)
        ) {
          const outputBase64 =
            Buffer.from(
              imageResult
            ).toString("base64");

          return `data:image/png;base64,${outputBase64}`;
        }

        throw new Error(
          "Unsupported Cloudflare image response format."
        );
      }

      /*
       * -------------------------------------------------------
       * Binary image response
       * -------------------------------------------------------
       */

      const outputBuffer =
        await response.arrayBuffer();

      if (
        outputBuffer.byteLength === 0
      ) {
        throw new Error(
          "Cloudflare returned an empty image."
        );
      }

      const outputBase64 =
        Buffer.from(
          outputBuffer
        ).toString("base64");

      let outputMimeType =
        contentType;

      if (
        !outputMimeType.startsWith(
          "image/"
        )
      ) {
        outputMimeType =
          "image/png";
      }

      return `data:${outputMimeType};base64,${outputBase64}`;
    };

    /*
     * ---------------------------------------------------------
     * Generate all 3 images
     * ---------------------------------------------------------
     */

    const results =
      await Promise.all(
        prompts.map((prompt) =>
          generateDesign(prompt)
        )
      );

    /*
     * ---------------------------------------------------------
     * Success
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      images: results,

      plan,

      generationsUsed,

      generationsLimit:
        admin
          ? null
          : limits.generations,

      remaining,

      designsPerGeneration:
        admin
          ? styles.length
          : limits.designs,

      isAdmin: admin,
    });
  } catch (error) {
    console.error(
      "Failed to generate redesign:",
      error
    );

    /*
     * ---------------------------------------------------------
     * Refund generation if Cloudflare failed
     * ---------------------------------------------------------
     */

    if (
      reservedGeneration &&
      reservedUserId
    ) {
      try {
        await prisma.user.update({
          where: {
            clerkUserId:
              reservedUserId,
          },
          data: {
            generationsUsed: {
              decrement: 1,
            },
          },
        });
      } catch (refundError) {
        console.error(
          "Failed to refund generation:",
          refundError
        );
      }
    }

    const message =
      getErrorMessage(error);

    return NextResponse.json(
      {
        error:
          message ||
          "Failed to generate redesign.",
      },
      { status: 500 }
    );
  }
}