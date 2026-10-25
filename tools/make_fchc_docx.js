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

const fig=fs.readFileSync('weeksfig.png'), cal=fs.readFileSync('appendix.png');

const doc=new Document({
  footnotes:{
    1:{children:[new Paragraph({children:[
        run("Fredericksburg Christian Health Center, IRS Form 990 for the year ending December 2024, as digitized by ",{size:16}),
        link("ProPublica Nonprofit Explorer","https://projects.propublica.org/nonprofits/organizations/542061482"),
        run(". EIN 54-2061482.",{size:16})]})]},
    2:{children:[new Paragraph({children:[
        run("Marginal overhead at 40 percent of collections. Family medicine averages nearer 60 percent (",{size:16}),
        link("AAFP, Family Practice Management","https://www.aafp.org/pubs/fpm/issues/2010/0300/p38.html"),
        run("), but most of that is rent, records, management and front desk, which another session does not add to. Your own marginal figure would be better than my estimate.",{size:16})]})]},
    3:{children:[new Paragraph({children:[
        link("MGMA Provider Compensation, 2024 report on 2023 data","https://mgmatraining.com/wp-content/uploads/2025/01/ProviderSpecialtyRollUps2024.pdf"),
        run(". Primary care, all practices, 36,368 providers.",{size:16})]})]},
    4:{children:[new Paragraph({children:[
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

      section("What I am proposing"),
      body("A salaried part-time position at 0.75 FTE and $41,500 a year, beginning 1 June 2028. The eighteen months before it are for testing whether the figures in this document hold. Nothing here needs deciding now."),

      section("Between now and June 2028"),
      body("I continue on the current hourly arrangement through May 2028. The schedule in Section 5 is built for the years when we expect young children at home, which begin in 2029. Starting in June 2028 gives us a quarter to find the problems before the schedule has to hold."),
      body("What changes between now and then is that we begin tracking two things neither of us knows yet: what the clinic collects per encounter, and whether demand supports sixteen patients in a ten-hour day. Both come from the clinic's own records. If the October 2027 check shows they do not hold, we do not do this and the hourly arrangement continues.",{after:90}),
      table2([
        ["January 2027","Current arrangement continues. Tracking begins."],
        ["October 2027","First check. Are collections and volume where they need to be?"],
        ["January 2028","Decide, and write the contract if the answer is yes."],
        ["1 June 2028","Salaried position begins."],
        ["August 2028","Review the first quarter against the figures below."]]),

      section("What we measure"),
      body("One number matters more than the rest. For every dollar the clinic pays me, how much does it keep once my sessions are paid for?",{after:80}),
      table(["","At $90 a visit","At $103 a visit"],[
        ["16 patients a day","59 cents","81 cents"],
        ["20 patients a day","98 cents","$1.27"]]),
      body("That is collections from my sessions, less the overhead another session actually adds, less what I cost including payroll taxes, divided by what I cost. Sections 6 and 7 show the arithmetic. We would review it each August against the year before.",{after:80}),
      new Paragraph({spacing:{line:264,lineRule:"auto",after:0},
        children:[run("For scale, the clinic took in $1,643,163 in 2024 against $1,622,030 of expenses, a net margin of 1.3 percent, with $950,079 of that from program services"),
                  new FootnoteReferenceRun(1),
                  run(". At sixteen patients a day my sessions would collect $119,520 to $136,784. Whether that is all new revenue depends on whether these are encounters the clinic would not otherwise have had. I could not find a published figure for what a clinic earns on a physician's cost generally, so the benchmark I would use is the clinic's own, year over year.")]}),

      new Paragraph({children:[new PageBreak()]}),

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
        children:[run("What matters is what another session adds, not what the practice averages. Rent, the records system, management and the front desk do not change because I am there on a Tuesday. After marginal overhead"),
                  new FootnoteReferenceRun(2),
                  run(" and after paying me:")]}),
      table(["","At $90 a visit","At $103 a visit"],[
        ["16 patients a day","$26,477","$36,811"],
        ["20 patients a day","$44,405","$57,323"]]),
      new Paragraph({spacing:{line:264,lineRule:"auto",before:110,after:0},
        children:[run("By comparison, median total compensation for a primary care physician is $312,427, and the lower quartile is $256,853"),
                  new FootnoteReferenceRun(3),
                  run(". This role is $41,500.")]}),

      section("One request about wording"),
      new Paragraph({spacing:{line:264,lineRule:"auto",after:0},
        children:[run("I am working toward Public Service Loan Forgiveness"),
          new FootnoteReferenceRun(4),
          run(". The form asks the clinic for my average hours per week, counting vacation and leave. Writing the contract as 0.75 FTE, 30 hours per week annualized gives that figure directly.")]}),

      new Paragraph({children:[new PageBreak()]}),
      new Paragraph({spacing:{line:240,lineRule:"auto",after:0},
        children:[new ImageRun({type:"png",data:cal,
          transformation:{width:720,height:Math.round(720*1792/2240)}})]}),
    ]}]});

Packer.toBuffer(doc).then(b=>{fs.writeFileSync('FCHC-proposal.docx',b);console.log('built');});
