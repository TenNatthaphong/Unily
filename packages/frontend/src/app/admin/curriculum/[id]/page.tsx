import { EditorContainer } from "@/components/admin/curriculum-editor/editor-container";

// 1. ปรับฟังก์ชันดึงข้อมูลให้รองรับ Error ได้ดีขึ้น
async function getData(id: string) {
  try {
    const baseUrl = "http://localhost:3333";
    
    // เรียกข้อมูลหลักสูตร
    const currRes = await fetch(`${baseUrl}/curriculums/${id}`, { 
      cache: 'no-store' 
    });

    if (!currRes.ok) {
      console.error(`❌ Curriculum API Error: ${currRes.status} for ID: ${id}`);
      return null;
    }

    const curriculum = await currRes.json();
    
    // เรียกข้อมูลวิชาทั้งหมดสำหรับ Sidebar (ขอ limit เยอะๆ เพื่อให้มาครบ)
    const allCoursesRes = await fetch(`${baseUrl}/course?limit=1000`, { cache: 'no-store' });
    const allCoursesJson = allCoursesRes.ok ? await allCoursesRes.json() : { data: [] };
    const allCourses = allCoursesJson.data || [];

    return { curriculum, allCourses };
  } catch (error) {
    console.error("❌ Network error:", error);
    return null;
  }
}

// 2. หน้า Page ต้อง await params ก่อนเสมอ (สำหรับ Next.js เวอร์ชั่นใหม่)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // ต้อง await params ตรงนี้ครับ!
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const data = await getData(id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100">
          <h1 className="text-4xl font-black text-gray-200 mb-2">404</h1>
          <h2 className="text-xl font-bold text-gray-800">ไม่พบข้อมูลหลักสูตร</h2>
          <p className="text-gray-400 mt-2 text-sm">ตรวจสอบว่า NestJS รันอยู่ และ ID: <span className="font-mono text-blue-600">{id}</span> ถูกต้อง</p>
          <a href={`/admin/curriculum/${id}`} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-100 inline-block">ลองใหม่อีกครั้ง</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Header ดีไซน์เป๊ะตามสั่ง */}
      <header className="h-16 border-b flex items-center px-8 bg-white justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-blue-200 shadow-lg cursor-pointer hover:rotate-3 transition-transform">U</div>
          <div>
            <h1 className="font-bold text-gray-800 leading-none">{data.curriculum.name}</h1>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 block">Curriculum Year {data.curriculum.year}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Preview</button>
          <button className="px-6 py-2 text-sm bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
            Save Changes
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <EditorContainer 
        curriculumId={id} 
        initialItems={data.curriculum.curriculumCourses || []} 
        allCourses={data.allCourses || []} 
      />
    </div>
  );
}