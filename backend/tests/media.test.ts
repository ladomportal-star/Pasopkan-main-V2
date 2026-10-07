import { describe, expect, it } from "vitest";
import { assertMediaReferences, resolveImage, uploadImage } from "../src/services/media.service.ts";
import { prepareMedia, resolveMedia } from "../../frontend/src/lib/media.ts";
import { fromBackendEvent, toEventPayload } from "../../frontend/src/lib/eventPayload.ts";

const publicRef = "storage://listing-media/owner/abcd-1234.png";
const privateRef = "storage://private-media/owner/abcd-1234.png";
describe("media safety and form mapping", () => {
  it("rejects foreign, malformed, private listing references and expiring URLs", () => {
    expect(() => assertMediaReferences(publicRef, "owner", "public")).not.toThrow();
    expect(() => assertMediaReferences(publicRef, "other")).toThrow();
    expect(() => assertMediaReferences(privateRef, "owner", "public")).toThrow();
    expect(() => assertMediaReferences(publicRef + "/../x", "owner")).toThrow();
    expect(() =>
      assertMediaReferences("https://example.test/storage/v1/object/sign/x?token=x", "owner"),
    ).toThrow();
    expect(() => assertMediaReferences("data:image/png;base64,abcd", "owner")).toThrow();
  });
  it("rejects invalid image bytes and unauthorized private resolution before storage access", async () => {
    await expect(
      uploadImage("owner", "data:image/png;base64,AAAAAAAAAAAAAAAA", "public"),
    ).rejects.toThrow();
    await expect(resolveImage("stranger", privateRef)).rejects.toThrow("Private media");
  });
  it("uploads known fields with appropriate visibility without changing descriptions", async () => {
    const calls: string[] = [];
    const result = await prepareMedia(
      {
        avatarUrl: "data:image/png;base64,a",
        coverImageUrl: "data:image/png;base64,b",
        description: "data:text/plain,a",
        galleryUrls: [publicRef],
      },
      async (_, visibility) => {
        calls.push(visibility);
        return visibility === "private" ? privateRef : publicRef;
      },
    );
    expect(calls).toEqual(["private", "public"]);
    expect(result).toEqual({
      avatarUrl: privateRef,
      coverImageUrl: publicRef,
      description: "data:text/plain,a",
      galleryUrls: [publicRef],
    });
  });
  it("propagates upload failure instead of saving base64", async () => {
    await expect(
      prepareMedia({ avatarUrl: "data:x" }, async () => {
        throw new Error("Unavailable");
      }),
    ).rejects.toThrow("Unavailable");
  });
  it("keeps storage references through an event display/edit round trip", async () => {
    const resolved = await resolveMedia(
      { id: "event", title: "Show", coverImageUrl: publicRef, galleryUrls: [publicRef], tiers: [] },
      async () => "https://cdn.test/image.png",
    );
    const event = fromBackendEvent(resolved);
    expect(event.image).toBe("https://cdn.test/image.png");
    const payload = toEventPayload(event);
    expect(payload.coverImageUrl).toBe(publicRef);
    expect(payload.galleryUrls).toEqual([publicRef]);
    event.image = "data:new-image";
    expect(toEventPayload(event).coverImageUrl).toBe("data:new-image");
  });
});
