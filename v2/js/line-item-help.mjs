const FRIENDLY = {
  'Regular Pay':'Regular pay','Overtime Pay':'Overtime','Baylor Time':'Baylor pay','Charge Pay':'Resource / Flow',
  'Night Shift Differential':'Night shift','Evening Shift':'Evening shift','Weekend Differential':'Weekend','Preceptor':'Preceptor',
  'Vacation Pay':'Vacation','Sick Pay':'Sick time','MA Sick':'MA sick time','Scheduled Personal':'Scheduled personal time',
  'Unscheduled Personal':'Unscheduled personal time','Bereavement':'Bereavement','Meeting':'Meeting','Paid Training':'Paid training',
  'Holiday':'Holiday pay','Scheduled Holiday':'Scheduled holiday','Holiday Worked':'Holiday worked','Holiday Worked OT':'Major holiday pay',
  'Holiday Overtime':'Holiday overtime','Holiday Worked 0.5':'Extra holiday premium','Cash Out Holiday':'Holiday cash-out',
  'Certification Bonus':'Certification bonus'
};
export function friendlyPayCode(code){return FRIENDLY[code]||code||'Unknown pay type';}

const GENERIC=[
  {id:'hours',label:'The hours look wrong'},
  {id:'rate',label:'The rate looks wrong'},
  {id:'missing',label:'I think something is missing'},
  {id:'meaning',label:"I'm not sure what this means"},
];

export function concernOptions(code){
  if(code==='Overtime Pay'||code==='Holiday Overtime') return [
    {id:'hours',label:'The OT hours look wrong'},
    {id:'rate',label:'The OT rate looks wrong'},
    {id:'why-rate-changes',label:"I don't understand why the OT rate changes"},
    {id:'missing',label:'I think some OT is missing'},
  ];
  if(['Night Shift Differential','Charge Pay','Evening Shift','Weekend Differential','Preceptor'].includes(code)) return [
    {id:'hours',label:'The hours look wrong'},
    {id:'rate',label:'The rate looks wrong'},
    {id:'missing',label:`I worked ${friendlyPayCode(code)} hours that are not listed`},
    {id:'meaning',label:"I'm not sure what this means"},
  ];
  if(code==='Certification Bonus') return [
    {id:'did-not-receive',label:'I did not receive this bonus'},
    {id:'amount',label:'The amount looks wrong'},
    {id:'date',label:'The date looks wrong'},
    {id:'meaning',label:"I'm not sure what this means"},
  ];
  if(code==='Regular Pay') return [
    {id:'hours',label:'Some hours are missing or wrong'},
    {id:'step',label:'I think my pay step is wrong'},
    {id:'rate',label:'The hourly rate looks wrong'},
    {id:'meaning',label:"I'm not sure what this means"},
  ];
  return GENERIC;
}

export function concernResponse(code, issue){
  if(issue==='why-rate-changes') return {
    title:'Why your OT rate changes',
    body:'Your OT rate can change from week to week. Extra pay such as Night, Weekend, Resource / Flow, Baylor, or holiday pay can raise the OT rate for that week. The checker checks those weeks separately.',
    next:'Use “Show the math” if you want to see the formula.'
  };
  if(issue==='step') return {
    title:'Checking your pay step',
    body:'The checker can usually see when your hourly rate changed. If the timing does not look right to you, the next useful detail is when you normally move to your next step each year.',
    next:'Only enter that date if the change shown by the checker looks wrong.'
  };
  if(issue==='missing' && (code==='Night Shift Differential'||code==='Charge Pay')) return {
    title:`Checking missing ${friendlyPayCode(code)} pay`,
    body:'If you worked these hours but they are not shown on the retro statement, the checker may need an earlier pay stub or another record to calculate the missing pay and any related OT change.',
    next:'Note roughly when the missing hours occurred.'
  };
  if(issue==='meaning') return {
    title:friendlyPayCode(code),
    body:`The checker can explain what ${friendlyPayCode(code)} means and how it was handled on this statement.`,
    next:'Open Pay terms for a plain-English explanation.'
  };
  return {
    title:`Let's check ${friendlyPayCode(code)}`,
    body:'The checker keeps the amount shown by Workday separate from anything you tell it. Your answer can help identify missing hours, a wrong rate, or another issue that the PDF alone cannot prove.',
    next:'Choose the detail that looks wrong and provide only the information needed for that item.'
  };
}
