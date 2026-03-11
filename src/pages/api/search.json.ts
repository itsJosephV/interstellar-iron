import { getCollection } from "astro:content";

export async function GET() {
  const posts = await getCollection("posts");

  const data = posts.map((post) => ({
    slug: post.slug,
    title: post.data.title,
    category: post.data.category,
    date: post.data.date,
  }));

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
