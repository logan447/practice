const fs = require('fs');
const {Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
       WidthType, ShadingType, AlignmentType, BorderStyle, ImageRun,
       PageBreak, PageOrientation} = require('docx');

const F = "Arial", SZ = 22;                 // 11pt
const run = (t, o={}) => new TextRun({text:t, font:F, size:SZ, ...o});
const p   = (t, o={}) => new Paragraph({
  spacing:{line:240, lineRule:"auto", after:(o.after??100)},
  alignment:o.align, children: t===null?[]:[run(t,{bold:o.bold, italics:o.italics,
                                                   size:o.size??SZ, color:o.color})]});
const h   = (t) => new Paragraph({
  spacing:{line:240, lineRule:"auto", before:160, after:70},
  children:[run(t,{bold:true})]});

const COLS = [3300, 2100, 2100];            // 7500 DXA total = 7.5in minus a hair
function table(head, rows, cols=COLS){
  const cell = (t,{b=false,sh=false,al}={}) => new TableCell({
    width:{size:cols[0], type:WidthType.DXA},
    shading: sh?{type:ShadingType.CLEAR, fill:"EEEEEE"}:undefined,
    margins:{top:40,bottom:40,left:90,right:90},
    children:[new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
      alignment:al, children:[run(t,{bold:b})]})]});
  const mk = (vals,{b=false,sh=false}={}) => new TableRow({children: vals.map((v,i)=>
    new TableCell({width:{size:cols[i],type:WidthType.DXA},
      shading: sh?{type:ShadingType.CLEAR, fill:"EEEEEE"}:undefined,
      margins:{top:40,bottom:40,left:90,right:90},
      children:[new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
        alignment: i?AlignmentType.RIGHT:AlignmentType.LEFT,
        children:[run(v,{bold:b})]})]}))});
  return new Table({columnWidths:cols, width:{size:cols.reduce((a,b)=>a+b,0),
    type:WidthType.DXA}, rows:[mk(head,{b:true,sh:true}), ...rows.map(r=>mk(r))]});
}

const img = fs.readFileSync('appendix.png');
const IMG_W = 700, IMG_H = Math.round(700*2586/2304);

const doc = new Document({sections:[{
  properties:{page:{size:{width:12240, height:15840},
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
    p("About 83 clinic days a year, roughly two a week, at ten hours each. I work the days my wife is home with our children. That is why the schedule comes quarterly rather than annually."),
    p("Some weeks carry four clinic days. Some carry one. About six weeks a year carry none. The clinic would see each of those three months ahead."),
    p("I would keep twelve weeks off: two in January, one at spring break, two in May, three in summer, two at Thanksgiving, and the winter holidays."),
    p("We start at sixteen patients a day, which is 38 minutes a visit. If demand supports it we work up to twenty, which is 30 minutes. My salary is the same in either case."),

    h("What it costs the clinic"),
    p("$41,500, or $45,235 with payroll taxes. That figure does not change between the two cases."),
    table(["","16 patients a day","20 patients a day"],[
      ["Encounters a year","1,328","1,660"],
      ["My cost per encounter","$34.06","$27.25"],
      ["Share of collections at $90 a visit","38%","30%"],
      ["Share at $103 a visit","33%","26%"]]),
    new Paragraph({spacing:{line:240,lineRule:"auto",before:100,after:100},
      children:[run("Primary care commonly runs physician pay at 35 to 45 percent of collections. Sixteen a day falls inside that range. Twenty falls below it.")]}),

    h("What the clinic keeps"),
    p("After overhead at half of collections, and after paying me:"),
    table(["","At $90 a visit","At $103 a visit"],[
      ["16 patients a day","$14,525","$23,137"],
      ["20 patients a day","$29,465","$40,230"]]),
    new Paragraph({spacing:{line:240,lineRule:"auto",before:100,after:100},
      children:[run("Growing from sixteen to twenty adds about $15,000 of surplus and costs the clinic nothing, because my salary is fixed. If we reach twenty, the clinic could support a higher salary and still hold its margin. That is a later conversation, not a condition of this one.")]}),

    h("One request about wording"),
    p("I am working toward Public Service Loan Forgiveness. The form asks the clinic to report my average hours per week. Its instructions say to check Full-Time if that average is 30 hours or more, and that the figure should include vacation and leave time."),
    p("If my contract states 0.75 FTE at 30 hours per week annualized, that figure is 30 and I qualify. If it states a day rate or an hourly rate, a timesheet shows about 16 hours and I do not. The pay and the work are the same either way. Only the wording differs."),

    h("Two open questions"),
    p("What the clinic collects per encounter. My figures assume $90 to $103."),
    p("How quickly we try to grow from sixteen patients a day to twenty.", {after:0}),

    new Paragraph({children:[new PageBreak()]}),
    new Paragraph({spacing:{line:240,lineRule:"auto",after:120},
      children:[run("Appendix: an example year",{bold:true,size:26})]}),
    new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
      children:[new ImageRun({type:"png", data:img,
        transformation:{width:IMG_W, height:IMG_H}})]}),
  ]}]});

Packer.toBuffer(doc).then(b=>{fs.writeFileSync('FCHC-proposal.docx', b);
  console.log('written, image', IMG_W+'x'+IMG_H, 'px =', (IMG_H/96).toFixed(2)+'in tall');});
