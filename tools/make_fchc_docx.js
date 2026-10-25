const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,
       AlignmentType,BorderStyle,ImageRun,PageBreak,Footer,PageNumber,
       FootnoteReferenceRun,ExternalHyperlink,TabStopType,TabStopPosition}=require('docx');

const F="Arial", SZ=21;                     // 10.5pt body
const GREEN="1D7A5C", ORANGE="C47D20", GREY="5F6874", RULE="C9D5D1";
const run=(t,o={})=>new TextRun({text:t,font:F,size:o.size??SZ,...o});
const NONE={style:BorderStyle.NONE,size:0,color:"FFFFFF"};

const body=(t,o={})=>new Paragraph({spacing:{line:264,lineRule:"auto",after:o.after??110},
  children:Array.isArray(t)?t:[run(t,o)]});

let secN=0;
const section=(t)=>new Paragraph({spacing:{line:240,lineRule:"auto",before:230,after:90},
  children:[run(String(++secN)+"   ",{color:ORANGE,bold:true,size:20}),
            run(t.toUpperCase(),{color:GREEN,bold:true,size:20,
              characterSpacing:24})]});

const COLS=[5000,2900,2900];
function table(head,rows){
  const cell=(v,i,{hdr=false,last=false}={})=>new TableCell({
    width:{size:COLS[i],type:WidthType.DXA},
    margins:{top:hdr?30:70,bottom:hdr?70:70,left:0,right:120},
    borders:{top:NONE,left:NONE,right:NONE,
      bottom:{style:BorderStyle.SINGLE,size:hdr?8:4,
              color:hdr?GREEN:RULE}},
    children:[new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
      alignment:i?AlignmentType.RIGHT:AlignmentType.LEFT,
      children:[run(v,hdr?{color:GREY,bold:true,size:16,characterSpacing:20}
                         :{bold:i===0})]})]});
  return new Table({columnWidths:COLS,
    width:{size:10800,type:WidthType.DXA},
    rows:[new TableRow({children:head.map((v,i)=>cell(v.toUpperCase(),i,{hdr:true}))}),
          ...rows.map(r=>new TableRow({children:r.map((v,i)=>cell(v,i))}))]});
}

const link=(t,url)=>new ExternalHyperlink({link:url,
  children:[run(t,{color:GREEN,underline:{}})]});

const fig=fs.readFileSync('weeksfig.png'), cal=fs.readFileSync('appendix.png');

const doc=new Document({
  footnotes:{
    1:{children:[new Paragraph({children:[
        run("Overhead at 60 percent of collections. ",{size:16}),
        link("AAFP, Family Practice Management (2010)","https://www.aafp.org/pubs/fpm/issues/2010/0300/p38.html"),
        run(", citing MGMA survey data.",{size:16})]})]},
    2:{children:[new Paragraph({children:[
        run("",{size:16}),
        link("PSLF & TEPSLF Certification & Application","https://studentaid.gov/sites/default/files/public-service-application-for-forgiveness.pdf"),
        run(", U.S. Department of Education. Section 7 and the Section 3 instructions.",{size:16})]})]}},
  sections:[{
    properties:{page:{size:{width:12240,height:15840},
      margin:{top:720,bottom:650,left:720,right:720}}},
    footers:{default:new Footer({children:[new Paragraph({
      tabStops:[{type:TabStopType.RIGHT,position:TabStopPosition.MAX}],
      border:{top:{style:BorderStyle.SINGLE,size:4,color:RULE,space:6}},
      children:[run("Logan DuBose, MD   ·   For discussion",{size:16,color:GREY}),
                run("\t",{size:16}),
                run("Page ",{size:16,color:GREY}),
                new TextRun({children:[PageNumber.CURRENT],font:F,size:16,color:GREY}),
                run(" of ",{size:16,color:GREY}),
                new TextRun({children:[PageNumber.TOTAL_PAGES],font:F,size:16,color:GREY})]})]})},
    children:[
      new Paragraph({spacing:{line:240,lineRule:"auto",after:40},
        children:[run("Proposal for a part-time salaried position",{bold:true,size:34,color:GREEN})]}),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:40},
        children:[run("Logan DuBose, MD",{size:22,color:GREY})]}),

      section("The position"),
      body("A salaried role at 0.75 FTE, 30 hours per week annualized, at $41,500 a year. I would give the clinic my schedule a quarter at a time, as I do now."),

      section("The schedule"),
      body("About 83 clinic days a year, roughly two a week, at ten hours each. We start at sixteen patients a day, which is 38 minutes a visit. If demand supports it we work up to twenty, which is 30 minutes. I would keep twelve weeks off.",{after:130}),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:40},
        children:[new ImageRun({type:"png",data:fig,transformation:{width:720,height:89}})]}),

      section("What it costs the clinic"),
      body("$41,500, or $45,235 with payroll taxes.",{after:80}),
      table(["","16 patients a day","20 patients a day"],[
        ["Encounters a year","1,328","1,660"],
        ["My cost per encounter","$34.06","$27.25"],
        ["Share of collections at $90 a visit","38%","30%"],
        ["Share at $103 a visit","33%","26%"]]),

      section("What the clinic keeps"),
      new Paragraph({spacing:{line:264,lineRule:"auto",after:80},
        children:[run("After overhead"),new FootnoteReferenceRun(1),
                  run(" and after paying me:")]}),
      table(["","At $90 a visit","At $103 a visit"],[
        ["16 patients a day","$2,573","$9,463"],
        ["20 patients a day","$14,525","$23,137"]]),

      section("One request about wording"),
      new Paragraph({spacing:{line:264,lineRule:"auto",after:0},
        children:[run("I am working toward Public Service Loan Forgiveness"),
          new FootnoteReferenceRun(2),
          run(". The form asks the clinic for my average hours per week, counting vacation and leave. Writing the contract as 0.75 FTE, 30 hours per week annualized gives that figure directly.")]}),

      new Paragraph({children:[new PageBreak()]}),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
        children:[new ImageRun({type:"png",data:cal,
          transformation:{width:700,height:Math.round(700*2586/2304)}})]}),
    ]}]});

Packer.toBuffer(doc).then(b=>{fs.writeFileSync('FCHC-proposal.docx',b);console.log('built');});
