import fm from "front-matter";
import fs from "fs/promises";
import path from "path";

const docsDirectory = path.join(process.cwd(), "content/docs");

type DocAttributes = {
  title: string;
  description: string;
  keywords?: string[];
};

export type DocType = {
  slug: string;
  url: string;
  attributes: DocAttributes;
  content: string;
};

export type DocSection = {
  title: string;
  docs: DocType[];
};

const SECTIONS: { title: string; slugs: string[] }[] = [
  {
    title: "Getting Started",
    slugs: ["", "getting-started"],
  },
  {
    title: "Build a CLI",
    slugs: ["create-cli", "resources", "commands"],
  },
  {
    title: "Ecosystem",
    slugs: ["agent-integration", "openclaw", "marketplace"],
  },
];

async function readMdxFile(
  filePath: string,
  slug: string,
): Promise<DocType | null> {
  try {
    const fileContents = await fs.readFile(filePath, "utf8");
    const matter = fm<DocAttributes>(fileContents);

    if (!matter.attributes.title || !matter.attributes.description) {
      return null;
    }

    return {
      slug,
      url: slug ? `/docs/${slug}` : "/docs",
      content: matter.body,
      attributes: matter.attributes,
    };
  } catch {
    return null;
  }
}

export async function getAllDocs(): Promise<DocType[]> {
  const allSlugs = SECTIONS.flatMap((s) => s.slugs);
  const docs = await Promise.all(
    allSlugs.map(async (slug) => {
      const fileName = slug === "" ? "index.mdx" : `${slug}.mdx`;
      return readMdxFile(path.join(docsDirectory, fileName), slug);
    }),
  );
  return docs.filter((doc): doc is DocType => doc !== null);
}

export async function getCurrentDoc(
  slugParts: string[] | undefined,
): Promise<DocType | null> {
  const slug = slugParts?.join("/") ?? "";
  const allDocs = await getAllDocs();
  return allDocs.find((doc) => doc.slug === slug) ?? null;
}

export async function getDocSections(): Promise<DocSection[]> {
  const allDocs = await getAllDocs();
  return SECTIONS.map((section) => ({
    title: section.title,
    docs: section.slugs
      .map((slug) => allDocs.find((d) => d.slug === slug))
      .filter((d): d is DocType => d !== null),
  }));
}

export type DocParams = {
  params: Promise<{ slug?: string[] }>;
};
