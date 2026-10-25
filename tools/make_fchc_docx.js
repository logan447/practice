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
const COLS2=[2600,8200];
function table2(rows){
  return new Table({columnWidths:COLS2,width:{size:10800,type:WidthType.DXA},
    rows:rows.map(function(r){return new TableRow({children:r.map(function(v,i){
      return new TableCell({width:{size:COLS2[i],type:WidthType.DXA},
        margins:{top:70,bottom:70,left:0,right:140},
        borders:{top:NONE,left:NONE,right:NONE,
          bottom:{style:BorderStyle.SINGLE,size:4,color:RULE}},
        children:[new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
          children:[run(v,{bold:i===0,color:i===0?GREEN:undefined})]})]});
    })});})});
}
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

const cal=fs.readFileSync('appendix.png'), gantt=fs.readFileSync('gantt.png'),
      nowthen=fs.readFileSync('nowthen.png');

const doc=new Document({
  footnotes:{
    1:{children:[new Paragraph({children:[
        link("MGMA Provider Compensation, 2024 report on 2023 data","https://mgmatraining.com/wp-content/uploads/2025/01/ProviderSpecialtyRollUps2024.pdf"),
        run(". Primary care, all practices, 36,368 providers.",{size:16})]})]}},
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

      section("The proposal"),
      body("A salaried part-time position at 0.75 FTE and $41,500 a year, beginning 1 June 2028. Until then we stay on the current hourly arrangement and use it to prove the economics work and the demand is there.",{after:150}),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:60},
        children:[new ImageRun({type:"png",data:gantt,
          transformation:{width:720,height:Math.round(720*472/2160)}})]}),

      section("My compensation and schedule"),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:140},
        children:[new ImageRun({type:"png",data:nowthen,
          transformation:{width:720,height:Math.round(720*682/2160)}})]}),
      new Paragraph({spacing:{line:264,lineRule:"auto",after:0},
        children:[run("The salary is $41,500 a year, or $45,235 with payroll taxes. Median total compensation for a primary care physician is $312,427"),
                  new FootnoteReferenceRun(1),
                  run(".")]}),

      new Paragraph({children:[new PageBreak()]}),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
        children:[new ImageRun({type:"png",data:cal,
          transformation:{width:720,height:Math.round(720*1792/2240)}})]}),
    ]}]});

Packer.toBuffer(doc).then(b=>{fs.writeFileSync('FCHC-proposal.docx',b);console.log('built');});
