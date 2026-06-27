import type { Reel, SocialPost } from "./types";

// Publishing. LinkedIn uses the real UGC Posts API when a token is configured;
// Instagram is mocked (Graph API needs an approved business app + review).

export function linkedinConfigured(): boolean {
  return Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN);
}

function nowIso() {
  return new Date().toISOString();
}

export async function publishToLinkedIn(reel: Reel): Promise<SocialPost> {
  const caption = reel.script?.postCaption || reel.topic;

  if (!linkedinConfigured()) {
    console.log(`[linkedin:mock] would post: "${caption}"`);
    return {
      platform: "linkedin",
      status: "mocked",
      url: null,
      postedAt: nowIso(),
      detail: "LINKEDIN_ACCESS_TOKEN/AUTHOR_URN missing — simulated post",
    };
  }

  try {
    // Text share via the UGC Posts API. (Native video upload is a multi-step
    // register→upload→attach flow; we ship the caption + link for the hackathon.)
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        "content-type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: process.env.LINKEDIN_AUTHOR_URN, // e.g. "urn:li:person:xxxx"
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: caption },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (!res.ok) throw new Error(`LinkedIn ${res.status}: ${await res.text()}`);
    const id = res.headers.get("x-restli-id");
    return {
      platform: "linkedin",
      status: "posted",
      url: id ? `https://www.linkedin.com/feed/update/${id}` : null,
      postedAt: nowIso(),
      detail: "Posted via LinkedIn UGC API",
    };
  } catch (err) {
    console.warn("[linkedin] post failed:", err);
    return { platform: "linkedin", status: "failed", url: null, postedAt: null, detail: String(err) };
  }
}

export async function publishToInstagram(reel: Reel): Promise<SocialPost> {
  const caption = reel.script?.postCaption || reel.topic;
  console.log(`[instagram:mock] would post reel ${reel.id}: "${caption}"`);
  return {
    platform: "instagram",
    status: "mocked",
    url: null,
    postedAt: nowIso(),
    detail: "Instagram Graph API requires an approved business app — simulated",
  };
}
