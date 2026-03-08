import { cn } from "@/lib/utils";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { rehypePlugins, remarkPlugins } from "./markdown.config";

type ServerMdxProps = {
  source: string;
  className?: string;
};

export const ServerMdx = (props: ServerMdxProps) => {
  return (
    <div className={cn("docs-content", props.className)}>
      <MDXRemote
        source={props.source}
        options={{
          mdxOptions: {
            remarkPlugins,
            rehypePlugins,
            format: "mdx",
          },
        }}
      />
    </div>
  );
};
