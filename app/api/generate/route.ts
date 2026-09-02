import { NextRequest, NextResponse } from "next/server";

const NUMBER_OF_DESIGNS = 3;

export async function POST(request: NextRequest) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Cloudflare credentials are missing." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");

    const style = String(
      formData.get("style") || "modern"
    );

    const room = String(
      formData.get("room") || "Living Room"
    );

    const preserve = String(
      formData.get("preserve") ||
        "Layout + windows + doors"
    );

    const creativity = String(
      formData.get("creativity") || "Balanced"
    );

    // Additional instructions from the user
    const additionalPrompt = String(
      formData.get("additionalPrompt") || ""
    ).trim();

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "No image was uploaded." },
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Uploaded file must be an image." },
        { status: 400 }
      );
    }

    const variationPrompts = [
      `
Create a clean, elegant and realistic ${style} interior redesign.

Focus on balanced furniture, clean lines and natural colors.
      `,

      `
Create a warm, cozy and inviting ${style} interior redesign.

Focus on warm lighting, soft textures and natural materials.
      `,

      `
Create a premium, modern and high-end ${style} interior redesign.

Focus on designer furniture and sophisticated materials.
      `,

      `
Create a minimalist ${style} interior redesign.

Focus on simplicity, open space, functional furniture and very little decoration.
      `,

      `
Create a bold contemporary ${style} interior redesign.

Use interesting furniture, sophisticated contrasts and distinctive decorative elements.
      `,
    ];

    const model =
      "@cf/black-forest-labs/flux-2-klein-4b";

    async function generateDesign(
      variationPrompt: string
    ) {
      const userInstructions = additionalPrompt
        ? `
USER'S ADDITIONAL INSTRUCTIONS:

${additionalPrompt}

Follow these instructions carefully.

Add, remove, move or modify objects only when requested by the user.

The requested objects should look physically realistic and naturally integrated into the room.

Make sure the requested objects have realistic scale, perspective, position, materials, lighting and shadows.

Do not ignore the user's requested changes.
`
        : "";

      const prompt = `
Redesign this ${room} interior in a ${style} interior design style.

${variationPrompt}

Preserve:

${preserve}.

Creativity level:

${creativity}.

${userInstructions}

IMPORTANT:

- Keep the original room structure.
- Keep the original camera perspective.
- Keep the architecture unchanged.
- Do not move windows unless the user explicitly asks for it.
- Do not move doors unless the user explicitly asks for it.
- Keep the room recognizable as the same physical space.
- Do not change the room dimensions.
- Improve furniture, materials, colors, lighting and decoration.
- Any objects requested by the user must be incorporated into the existing room.
- Maintain realistic proportions and perspective.
- Make all newly added furniture and objects physically plausible.
- The result must look like a real professionally photographed interior.
- Do not create a 3D render.
- Do not create an illustration.
- Do not add text, labels or watermarks to the image.

The final image should look like a realistic photograph of the same room after a professional interior redesign.
      `.trim();

      const cloudflareForm = new FormData();

      cloudflareForm.append("prompt", prompt);

      const imageFile = image as File;

      cloudflareForm.append(
        "input_image_0",
        imageFile,
        imageFile.name
      );

      cloudflareForm.append("width", "1920");
      cloudflareForm.append("height", "1080");

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
          body: cloudflareForm,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Cloudflare error:",
          errorText
        );

        throw new Error(
          "Cloudflare AI request failed."
        );
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json")
      ) {
        const data = await response.json();

        if (data?.result?.image) {
          return `data:image/jpeg;base64,${data.result.image}`;
        }

        throw new Error(
          "Cloudflare did not return an image."
        );
      }

      const result = await response.arrayBuffer();

      const base64 =
        Buffer.from(result).toString("base64");

      return `data:image/png;base64,${base64}`;
    }

    // Generate all designs at the same time
    const images = await Promise.all(
      variationPrompts
        .slice(0, NUMBER_OF_DESIGNS)
        .map((prompt) => generateDesign(prompt))
    );

    return NextResponse.json({
      images,
    });
  } catch (error) {
    console.error(
      "Generate error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image generation failed.",
      },
      { status: 500 }
    );
  }
}