import svgPaths from "@/app/admin/components/../imports/svg-u8ep38b9zx";

export function UniyLogo({ className = "w-[80px] h-[60px]", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <div className={`${className} shrink-0`}>
      <svg className="block size-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 106 81">
        <path d={svgPaths.p24fcb000} fill={color} />
      </svg>
    </div>
  );
}
