// js/utils.js

export function getFilteredChildren(directory, exclusionList) {
  const filtered = {};
  for (const name in directory.children) {
    if (!exclusionList.includes(name)) {
      filtered[name] = directory.children[name];
    }
  }
  return filtered;
}

export function findItemByPath(path, fileSystem) {
  if (path === "~" || path === "") {
    return fileSystem["~"];
  }
  if (path === "/") {
    return fileSystem["/"];
  }

  let current;
  let parts;
  if (path.startsWith("/")) {
    current = fileSystem["/"];
    parts = path.split("/").filter(p => p);
  } else {
    current = fileSystem["~"];
    parts = path.replace(/^~\/?/, "").split("/").filter(p => p);
  }

  for (const part of parts) {
    if (!current || current.type !== "directory" || !current.children[part]) {
      return null;
    }
    current = current.children[part];
  }
  return current;
}

export function getCurrentDir(currentPath, fileSystem) {
  return findItemByPath(currentPath, fileSystem);
}

export function resolvePath(target, current) {
  let combinedPath;
  if (target.startsWith("/") || target.startsWith("~")) {
    combinedPath = target; // Absolute path
  } else {
    combinedPath = `${current.endsWith('/') ? current : current + '/'}${target}`; // Relative path
  }

  let isRoot = combinedPath.startsWith("/");
  let isHome = combinedPath.startsWith("~");

  let pathStr = combinedPath.replace(/^[~\/]+/, "");
  
  const pathSegments = pathStr.split("/");
  const resolvedSegments = [];
  for (const segment of pathSegments) {
    if (segment === "..") {
      if (resolvedSegments.length > 0) {
        resolvedSegments.pop();
      } else if (isHome) {
        isHome = false;
        isRoot = true;
      }
    } else if (segment !== "." && segment !== "") {
      resolvedSegments.push(segment);
    }
  }

  let prefix = isHome ? "~" : "/";
  if (prefix === "/" && resolvedSegments.length > 0) {
     return "/" + resolvedSegments.join("/");
  } else if (prefix === "~" && resolvedSegments.length > 0) {
     return "~/" + resolvedSegments.join("/");
  }
  return prefix;
}

export function preprocessObsidianSyntax(content) {
  // Updated Image syntax: ![[image.png|width]] or ![[image.png|widthxheight]]
  content = content.replace(/!\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, filename, size) => {
      const alt = filename.split('/').pop().split('.')[0];
      let styleAttr = '';
      if (size) {
          const sizeParts = size.split('x');
          const width = parseInt(sizeParts[0], 10);
          const height = sizeParts.length > 1 ? parseInt(sizeParts[1], 10) : null;

          let styles = [];
          if (!isNaN(width)) {
              styles.push(`width: ${width}px`);
          }
          if (height && !isNaN(height)) {
              styles.push(`height: ${height}px`);
          }
          if (styles.length > 0) {
              styleAttr = `style="${styles.join('; ')}"`;
          }
      }
      
      const src = `images/${filename}`;
      return `<img src="${src}" alt="${alt}" class="markdown-image" ${styleAttr}>`;
  });

  // File link syntax: [[file.md]]
  content = content.replace(
    /\[\[(.*?)\]\]/g,
    (match, p1) =>
      `<a class="file" href="#" data-path="${p1}" data-nav="${p1}">${p1}</a>`,
  );
  
  return content;
}
