const fs = require('fs');
const {Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
       WidthType, ShadingType, AlignmentType, BorderStyle, ImageRun,
       PageBreak} = require('docx');

const F="Arial", SZ=22;                               // 11pt
const run=(t,o={})=>new TextRun({text:t,font:F,size:SZ,...o});
const p=(t,o={})=>new Paragraph({spacing:{line:240,lineRule:"auto",after:o.after??100},
  children:[run(t,{bold:o.bold,color:o.color,size:o.size??SZ})]});
const h=(t)=>new Paragraph({spacing:{line:240,lineRule:"auto",before:160,after:70},
  children:[run(t,{bold:true})]});

const COLS=[5000,2900,2900];                          // 10800 DXA = full 7.5in
function table(head, rows){
  const mk=(vals,{b=false,sh=false}={})=>new TableRow({children:vals.map((v,i)=>
    new TableCell({width:{size:COLS[i],type:WidthType.DXA},
      shading: sh?{type:ShadingType.CLEAR,fill:"EEEEEE"}:undefined,
      margins:{top:40,bottom:40,left:90,right:90},
      children:[new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
        alignment:i?AlignmentType.RIGHT:AlignmentType.LEFT,
        children:[run(v,{bold:b})]})]}))});
  return new Table({columnWidths:COLS,
    width:{size:COLS.reduce((a,b)=>a+b,0),type:WidthType.DXA},
    rows:[mk(head,{b:true,sh:true}),...rows.map(r=>mk(r))]});
}

const fig = fs.readFileSync('weeksfig.png');          // 2160 x 267
const cal = fs.readFileSync('appendix.png');          // 2304 x 2586
const FIG_W=720, FIG_H=Math.round(720*267/2160);      // 7.5in wide
const CAL_W=700, CAL_H=Math.round(700*2586/2304);

const doc=new Document({sections:[{
  properties:{page:{size:{width:12240,height:15840},
    margin:{top:720,bottom:720,left:720,right:720}}},
  children:[
    new Paragraph({spacing:{line:240,lineRule:"auto",after:40},
      children:[run("Proposal for a part-time salaried position",{bold:true,size:28})]}),
    new Paragraph({spacing:{line:240,lineRule:"auto",after:160},
      border:{bottom:{style:BorderStyle.SINGLE,size:6,color:"999999",space:6}},
      children:[run("Logan DuBose, MD",{color:"444444"})]}),

    h("The position"),
    p("A salaried role at 0.75 FTE, 30 hours per week annualized, at $41,500 a year. I would give the clinic my schedule a quarter at a time, as I do now."),

    h("The schedule"),
    p("About 83 clinic days a year, roughly two a week, at ten hours each. We start at sixteen patients a day, which is 38 minutes a visit. If demand supports it we work up to twenty, which is 30 minutes. I would keep twelve weeks off.", {after:120}),
    new Paragraph({spacing:{line:240,lineRule:"auto",after:60},
      children:[new ImageRun({type:"png",data:fig,
        transformation:{width:FIG_W,height:FIG_H}})]}),

    h("What it costs the clinic"),
    p("$41,500, or $45,235 with payroll taxes. That figure does not change between the two cases.",{after:60}),
    table(["","16 patients a day","20 patients a day"],[
      ["Encounters a year","1,328","1,660"],
      ["My cost per encounter","$34.06","$27.25"],
      ["Share of collections at $90 a visit","38%","30%"],
      ["Share at $103 a visit","33%","26%"]]),
    new Paragraph({spacing:{line:240,lineRule:"auto",before:100,after:100},
      children:[run("Primary care commonly runs physician pay at 35 to 45 percent of collections. Sixteen a day falls inside that range. Twenty falls below it.")]}),

    h("What the clinic keeps"),
    p("After overhead at half of collections, and after paying me:",{after:60}),
    table(["","At $90 a visit","At $103 a visit"],[
      ["16 patients a day","$14,525","$23,137"],
      ["20 patients a day","$29,465","$40,230"]]),

    h("One request about wording"),
    p("I am working toward Public Service Loan Forgiveness. The form asks the clinic to report my average hours per week. Its instructions say to check Full-Time if that average is 30 hours or more, and that the figure should include vacation and leave time. If my contract states 0.75 FTE at 30 hours per week annualized, that figure is 30 and I qualify.",{after:0}),

    new Paragraph({children:[new PageBreak()]}),
    new Paragraph({spacing:{line:240,lineRule:"auto",after:120},
      children:[run("Appendix: an example year",{bold:true,size:26})]}),
    new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
      children:[new ImageRun({type:"png",data:cal,
        transformation:{width:CAL_W,height:CAL_H}})]}),
  ]}]});

Packer.toBuffer(doc).then(b=>{fs.writeFileSync('FCHC-proposal.docx',b);
  console.log('ok. figure',FIG_W+'x'+FIG_H,'=',(FIG_H/96).toFixed(2)+'in tall');});
