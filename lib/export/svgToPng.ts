/**
 * Rasterize inline <svg> elements to PNG and trigger a download.
 *
 * We deliberately avoid DOM-screenshot libraries (html-to-image) here: they try
 * to fetch+inline web fonts, which hangs. Serializing the SVG and drawing it to
 * a same-origin canvas is fast and deterministic. (codex flagged the
 * html-to-image font trap.)
 */

interface Raster {
  img: HTMLImageElement;
  w: number;
  h: number;
}

/** Serialize one <svg> to a same-origin image, sized from its viewBox. */
async function rasterizeSvg(svg: SVGSVGElement): Promise<Raster> {
  const vb = svg.viewBox.baseVal;
  const w = vb.width || svg.clientWidth || 900;
  const h = vb.height || svg.clientHeight || 240;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(
    new Blob([xml], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("svg image load failed"));
      img.src = url;
    });
    return { img, w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Trigger a browser download for a canvas as PNG via an object URL. */
async function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/png"),
  );
  if (!blob) throw new Error("canvas toBlob produced no PNG");
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Rasterize a single inline <svg> to a PNG and trigger a download. Rejects on
 * any failure so callers can surface an export error.
 */
export async function downloadSvgAsPng(
  svg: SVGSVGElement,
  filename: string,
  scale = 2,
): Promise<void> {
  const { img, w, h } = await rasterizeSvg(svg);
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  await downloadCanvas(canvas, filename);
}

/**
 * Rasterize several inline <svg>s and stack them vertically into one PNG (first
 * on top), on a white background with padding between. Used by the chord tool to
 * export the fretboard neck plus the common-fingering box in a single image.
 * Rejects on any failure so callers can surface an export error.
 */
export async function downloadSvgsAsPng(
  svgs: SVGSVGElement[],
  filename: string,
  scale = 2,
): Promise<void> {
  if (svgs.length === 0) throw new Error("no svgs to export");
  if (svgs.length === 1) return downloadSvgAsPng(svgs[0], filename, scale);

  const gap = 16; // vertical padding between stacked diagrams (CSS px)
  const rasters = await Promise.all(svgs.map(rasterizeSvg));
  const width = Math.max(...rasters.map((r) => r.w));
  const height =
    rasters.reduce((sum, r) => sum + r.h, 0) + gap * (rasters.length - 1);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  let y = 0;
  for (const r of rasters) {
    ctx.drawImage(r.img, 0, y);
    y += r.h + gap;
  }
  await downloadCanvas(canvas, filename);
}
