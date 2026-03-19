const paths: Record<string, string> = {
  p24fcb000: "M53 0L106 81H0L53 0Z",
};

const svgPaths = new Proxy(paths, {
  get: (target, prop: string) => {
    return target[prop] || "M0 0H1V1H0Z"; // Fallback to a tiny dot if missing
  }
});

export default svgPaths;
