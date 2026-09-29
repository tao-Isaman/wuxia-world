const compare=await context.newPage();
await compare.setViewportSize({width:1920,height:650});
await compare.goto('file:///D:/wusia-sim-web-wt/agent-175/review/world-final-evidence/comparison-final.html');
await compare.locator('section').nth(1).screenshot({path:'review/world-final-evidence/52-final-side-by-side-capital.png'});
await compare.locator('section').nth(2).screenshot({path:'review/world-final-evidence/53-final-side-by-side-night.png'});
await compare.locator('section').nth(3).screenshot({path:'review/world-final-evidence/54-final-side-by-side-dokapon.png'});
await compare.close();
return {comparisonsSaved:true,errors};
