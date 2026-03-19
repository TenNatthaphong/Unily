import svgPaths from "./svg-u8ep38b9zx";

function Frame2() {
  return (
    <div className="content-stretch flex font-['Inter:Semi_Bold','Noto_Sans_Thai:SemiBold',sans-serif] font-semibold gap-[60px] items-center justify-center leading-[50px] not-italic relative shrink-0 text-[#2d74e0] text-[20px] text-center whitespace-nowrap">
      <p className="relative shrink-0">หลักสูตรและวิชาเรียน</p>
      <p className="relative shrink-0">ลงทะเบียนเรียน</p>
      <p className="relative shrink-0">ปฎิทินและการแจ้งเตือน</p>
      <p className="relative shrink-0">ข้อมูลบุคคล</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[60px] items-center justify-center relative shrink-0">
      <div className="h-[81px] relative shrink-0 w-[106px]" data-name="logo">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 106 81">
          <path d={svgPaths.p24fcb000} fill="var(--fill-0, #2D74E0)" id="logo" />
        </svg>
      </div>
      <Frame2 />
    </div>
  );
}

function Group() {
  return (
    <div className="relative shrink-0 size-[25px]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p1fa36700} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.pc4d5180} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-[#deeafc] content-stretch flex gap-[12px] h-[40px] items-center justify-center px-[20px] py-[12px] relative rounded-[9999px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <Group />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[50px] not-italic relative shrink-0 text-[16px] text-black text-center whitespace-nowrap">Admin01</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[40px] top-[40px] w-[1367px]">
      <Frame3 />
      <Frame />
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[#deeafc] h-[40px] relative rounded-[30px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[30px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[12px] relative size-full">
          <div className="relative shrink-0 size-[20px]" data-name="Vector">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <path d={svgPaths.p36ce2700} fill="var(--fill-0, #03347C)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Wildcard() {
  return (
    <div className="bg-[#deeafc] content-stretch flex h-[29px] items-center justify-center px-[15px] py-[5px] relative rounded-[20px] shrink-0 w-[100px]" data-name="wildcard">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] text-center whitespace-nowrap">Wildcard</p>
    </div>
  );
}

function Filter() {
  return (
    <div className="bg-[#deeafc] content-stretch flex h-[29px] items-center justify-center px-[15px] py-[5px] relative rounded-[20px] shrink-0 w-[100px]" data-name="filter1">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] text-center whitespace-nowrap">any filter</p>
    </div>
  );
}

function Filter1() {
  return (
    <div className="bg-[#deeafc] content-stretch flex h-[29px] items-center justify-center px-[15px] py-[5px] relative rounded-[20px] shrink-0 w-[100px]" data-name="filter2">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] text-center whitespace-nowrap">Wildcard</p>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[20px] items-start min-h-px min-w-px overflow-clip relative w-full">
      <Wildcard />
      <Filter />
      <Filter1 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-h-px min-w-px relative w-full">
      <Frame6 />
      <Frame14 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] h-full items-center relative shrink-0 w-[225px]">
      <Frame4 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] whitespace-pre">{`<  1  2  3  ...  10  >`}</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
      <p className="relative shrink-0 text-[16px]">IDcourse</p>
      <p className="relative shrink-0 text-[12px]">x(x-x-x)</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame9 />
      <p className="relative shrink-0 text-[16px]">EnName</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 text-[12px]">
      <p className="relative shrink-0">IDcourse</p>
      <p className="relative shrink-0">EnName</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="relative shrink-0 text-[8px]">Prerequisite</p>
      <Frame11 />
    </div>
  );
}

function Card() {
  return (
    <div className="bg-[#deeafc] flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[15px]" data-name="card1">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold items-start justify-between leading-[normal] not-italic p-[12px] relative size-full text-[#03347c] text-center whitespace-nowrap">
        <Frame8 />
        <Frame10 />
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
      <p className="relative shrink-0 text-[16px]">IDcourse</p>
      <p className="relative shrink-0 text-[12px]">x(x-x-x)</p>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame16 />
      <p className="relative shrink-0 text-[16px]">EnName</p>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 text-[12px]">
      <p className="relative shrink-0">IDcourse</p>
      <p className="relative shrink-0">EnName</p>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="relative shrink-0 text-[8px]">Prerequisite</p>
      <Frame18 />
    </div>
  );
}

function Card1() {
  return (
    <div className="bg-[#deeafc] flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[15px]" data-name="card1">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold items-start justify-between leading-[normal] not-italic p-[12px] relative size-full text-[#03347c] text-center whitespace-nowrap">
        <Frame15 />
        <Frame17 />
      </div>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
      <p className="relative shrink-0 text-[16px]">IDcourse</p>
      <p className="relative shrink-0 text-[12px]">x(x-x-x)</p>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame20 />
      <p className="relative shrink-0 text-[16px]">EnName</p>
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 text-[12px]">
      <p className="relative shrink-0">IDcourse</p>
      <p className="relative shrink-0">EnName</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="relative shrink-0 text-[8px]">Prerequisite</p>
      <Frame22 />
    </div>
  );
}

function Card2() {
  return (
    <div className="bg-[#deeafc] flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[15px]" data-name="card1">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold items-start justify-between leading-[normal] not-italic p-[12px] relative size-full text-[#03347c] text-center whitespace-nowrap">
        <Frame19 />
        <Frame21 />
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
      <p className="relative shrink-0 text-[16px]">IDcourse</p>
      <p className="relative shrink-0 text-[12px]">x(x-x-x)</p>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame24 />
      <p className="relative shrink-0 text-[16px]">EnName</p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 text-[12px]">
      <p className="relative shrink-0">IDcourse</p>
      <p className="relative shrink-0">EnName</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="relative shrink-0 text-[8px]">Prerequisite</p>
      <Frame26 />
    </div>
  );
}

function Card3() {
  return (
    <div className="bg-[#deeafc] flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[15px]" data-name="card1">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold items-start justify-between leading-[normal] not-italic p-[12px] relative size-full text-[#03347c] text-center whitespace-nowrap">
        <Frame23 />
        <Frame25 />
      </div>
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
      <p className="relative shrink-0 text-[16px]">IDcourse</p>
      <p className="relative shrink-0 text-[12px]">x(x-x-x)</p>
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame28 />
      <p className="relative shrink-0 text-[16px]">EnName</p>
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 text-[12px]">
      <p className="relative shrink-0">IDcourse</p>
      <p className="relative shrink-0">EnName</p>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="relative shrink-0 text-[8px]">Prerequisite</p>
      <Frame30 />
    </div>
  );
}

function Card4() {
  return (
    <div className="bg-[#deeafc] flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[15px]" data-name="card1">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold items-start justify-between leading-[normal] not-italic p-[12px] relative size-full text-[#03347c] text-center whitespace-nowrap">
        <Frame27 />
        <Frame29 />
      </div>
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
      <p className="relative shrink-0 text-[16px]">IDcourse</p>
      <p className="relative shrink-0 text-[12px]">x(x-x-x)</p>
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame32 />
      <p className="relative shrink-0 text-[16px]">EnName</p>
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 text-[12px]">
      <p className="relative shrink-0">IDcourse</p>
      <p className="relative shrink-0">EnName</p>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="relative shrink-0 text-[8px]">Prerequisite</p>
      <Frame34 />
    </div>
  );
}

function Card5() {
  return (
    <div className="bg-[#deeafc] flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[15px]" data-name="card1">
      <div aria-hidden="true" className="absolute border border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold items-start justify-between leading-[normal] not-italic p-[12px] relative size-full text-[#03347c] text-center whitespace-nowrap">
        <Frame31 />
        <Frame33 />
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[24px] h-full items-start min-h-px min-w-px overflow-x-clip overflow-y-auto relative">
      <Card />
      <Card1 />
      <Card2 />
      <Card3 />
      <Card4 />
      <Card5 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-white h-[152px] relative rounded-[30px] shrink-0 w-full">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[12px] items-start justify-center px-[16px] py-[20px] relative size-full">
          <Frame13 />
          <Frame7 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-2 border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[30px]" />
    </div>
  );
}

function Sem() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem1">
      <p className="relative shrink-0">{`Semster 1 `}</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem1() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem2">
      <p className="relative shrink-0">{`Semster 2 `}</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem2() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem3">
      <p className="relative shrink-0">Semster 3</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem3() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem4">
      <p className="relative shrink-0">{`Semster 4 `}</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem4() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem5">
      <p className="relative shrink-0">Semster 5</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem5() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem6">
      <p className="relative shrink-0">{`Semster 6 `}</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem6() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem7">
      <p className="relative shrink-0">Semster 7</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem7() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem8">
      <p className="relative shrink-0">{`Semster 8 `}</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Sem8() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-full items-center justify-between leading-[normal] not-italic relative shrink-0 text-[#03347c] text-[16px] w-[120px] whitespace-nowrap" data-name="sem9">
      <p className="relative shrink-0">Semster 9</p>
      <p className="relative shrink-0">0(0-0-0)</p>
    </div>
  );
}

function Frame35() {
  return (
    <div className="bg-white content-stretch flex h-[720px] items-start justify-between px-[20px] py-[40px] relative rounded-[30px] shrink-0 w-[1389px]">
      <div aria-hidden="true" className="absolute border-2 border-[#2d74e0] border-solid inset-0 pointer-events-none rounded-[30px]" />
      <Sem />
      <Sem1 />
      <Sem2 />
      <Sem3 />
      <Sem4 />
      <Sem5 />
      <Sem6 />
      <Sem7 />
      <Sem8 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] items-center justify-center left-[20px] top-[134px] w-[1400px]">
      <Frame5 />
      <Frame35 />
    </div>
  );
}

export default function AdminManageCurriculum() {
  return (
    <div className="bg-white relative size-full" data-name="AdminManageCurriculum">
      <Frame1 />
      <Frame12 />
    </div>
  );
}