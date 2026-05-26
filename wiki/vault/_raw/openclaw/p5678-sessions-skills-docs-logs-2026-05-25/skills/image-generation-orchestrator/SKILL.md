---
name: image-generation-orchestrator
description: Orchestrate OpenClaw image generation and image editing requests. Use when a user asks to generate or edit an image, create a poster, cover, avatar, wallpaper, product image, visual draft, or style variation, compare image generation models, choose a model, or needs help selecting size, aspect ratio, resolution, reference images, count, or model-specific parameters for image_generate. Also use when the user wants the image prompt refined to reduce obvious generation artifacts or unrealistic details, such as broken hands, impossible object interactions, body parts passing through solid objects, inconsistent lighting, malformed text, extra fingers, duplicated limbs, distorted faces, incorrect reflections, or other strong AI-looking mistakes.
---

# Image Generation Orchestrator

When a user asks to generate or edit an image, use `image_generate` as the execution tool.

## Core workflow

1. Identify whether the request is text-to-image or image editing.
2. Identify whether the user explicitly specified a model.
3. If the user did not specify a model, use the configured default image generation model.
4. If the user specified a model that is not currently available at runtime, present the available models and ask the user to choose.
5. Use `image_generate` with `action: "list"` when needed to confirm the runtime-available providers, models, and capability hints before deciding.
6. If the currently selected model needs capability-specific parameter completion, read the appropriate reference file before replying.
7. If the user did not specify enough output parameters but the use case is obvious, recommend sensible defaults and proceed.
8. If the user provided reference images, validate that the selected model supports editing and the number of images is within limits.
9. Generate the image with `image_generate`.
10. After success, send the generated image to the user and report the actual model and key applied parameters.
11. If generation fails, follow fallback-aware handling and explain the next-best option.

## References

- For Google image model capabilities and parameter ranges, read `references/google-models.md`.
- For detailed interaction and decision rules, read `references/interaction-rules.md`.
- For prompt refinement rules that reduce obvious AI artifacts and improve realism, read `references/prompt-quality.md`.

## Execution rules

- Prefer direct execution when the request is already clear enough.
- Do not over-question the user for optional parameters.
- Check runtime model availability with `image_generate action=list` whenever availability is uncertain or model-specific capability guidance matters.
- If the user asks for multiple options, use the model limits for `count`.
- If parameters are unsupported by the chosen model, explain the supported alternatives.
- If OpenClaw remaps requested geometry during fallback, report the applied values after generation.
- Always deliver the final image output to the user after successful generation.

## Prompt refinement for realism and lower AI-artifact risk

Before generating, improve the prompt when the user wants a more natural, realistic, professional, or less AI-looking result.

- Add brief realism constraints when appropriate, especially for people, hands, tools, products, interiors, reflections, and text-heavy scenes.
- Prevent impossible interactions between body parts and solid objects.
- Prefer physically plausible pose, perspective, lighting, shadows, reflections, and object contact.
- Avoid common generation mistakes such as extra fingers, fused hands, duplicated limbs, distorted faces, unreadable text, floating objects, broken symmetry, or inconsistent reflections.
- If the image includes hands touching objects, explicitly preserve believable finger count, grip direction, contact position, and object occlusion.
- If the image includes people using tools or holding products, ensure the tool or product is correctly oriented and not intersecting with the hand or body.
- If the image includes mirrors, glass, or glossy surfaces, request reflections that match the scene geometry and light direction.
- If the image includes text that matters, warn the user that image models often render text poorly unless the text is short and simple.
- Keep these realism constraints concise. Do not bloat the prompt with long negative-prompt style lists unless the task clearly benefits from them.
