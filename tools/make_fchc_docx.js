const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,AlignmentType,BorderStyle,ImageRun,
       Footer,PageNumber,TabStopType,TabStopPosition}=require('docx');

const F="Arial", SZ=21;                     // 10.5pt body
const GREEN="1D7A5C", GREY="5F6874", RULE="C9D5D1";
const run=(t,o={})=>new TextRun({text:t,font:F,size:o.size??SZ,...o});

const body=(t,o={})=>new Paragraph({spacing:{line:264,lineRule:"auto",after:o.after??110},
  children:[run(t,o)]});

const heading=(t)=>new Paragraph({spacing:{line:240,lineRule:"auto",before:230,after:90},
  children:[run(t.toUpperCase(),{color:GREEN,bold:true,size:20,characterSpacing:24})]});

const img=(data,srcH,o={})=>new Paragraph({
  spacing:{line:240,lineRule:"auto",before:o.before??0,after:o.after??0},
  children:[new ImageRun({type:"png",data,
    transformation:{width:720,height:Math.round(720*srcH/2160)}})]});

const merged=fs.readFileSync('merged.png'), cal=fs.readFileSync('appendix.png');

const doc=new Document({
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
        children:[run("Proposal for a part-time clinical contract",{bold:true,size:34,color:GREEN})]}),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:150},
        children:[run("Logan DuBose, MD",{size:22,color:GREY})]}),

      body("Transition to a contract of 35 to 38 weeks a year, two clinic days a week at 15 clocked hours and $40 per hour, beginning June 1, 2028, while maintaining the current hourly arrangement until then to demonstrate sufficient demand and financial viability. Schedule provided a quarter in advance.",{after:190}),

      img(merged,488),

      heading("An example year"),
      img(cal,1652*2160/2240),
    ]}]});

Packer.toBuffer(doc).then(b=>{fs.writeFileSync('FCHC-proposal.docx',b);console.log('built');});
