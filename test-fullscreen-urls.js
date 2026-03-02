import { chromium } from 'playwright';

async function testURL(url) {
  console.log('\n' + '='.repeat(80));
  console.log(`TESTING URL: ${url}`);
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  try {
    console.log('\n📍 Navigating to URL...');
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);
    
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: `screenshot-${url.split('/').pop()}.png`, fullPage: true });
    
    console.log('\n🔍 Running console expressions:\n');
    
    // Expression 1: document.body.innerText
    const innerText = await page.evaluate(() => document.body.innerText);
    console.log('1) document.body.innerText:');
    console.log(innerText);
    console.log('');
    
    // Expression 2: document.body.innerText.includes("To exit full screen")
    const includesExitText = await page.evaluate(() => 
      document.body.innerText.includes("To exit full screen")
    );
    console.log(`2) document.body.innerText.includes("To exit full screen"):`);
    console.log(includesExitText);
    console.log('');
    
    // Expression 3: [...document.querySelectorAll('*')].filter(el => el.innerText?.includes('exit full screen')).length
    const exitElementsCount = await page.evaluate(() => 
      [...document.querySelectorAll('*')].filter(el => el.innerText?.includes('exit full screen')).length
    );
    console.log(`3) [...document.querySelectorAll('*')].filter(el => el.innerText?.includes('exit full screen')).length:`);
    console.log(exitElementsCount);
    console.log('');
    
    // Expression 4: document.fullscreenElement
    const fullscreenElement = await page.evaluate(() => 
      document.fullscreenElement ? document.fullscreenElement.tagName : null
    );
    console.log(`4) document.fullscreenElement:`);
    console.log(fullscreenElement);
    console.log('');
    
    // Expression 5: document.webkitFullscreenElement
    const webkitFullscreenElement = await page.evaluate(() => 
      document.webkitFullscreenElement ? document.webkitFullscreenElement.tagName : null
    );
    console.log(`5) document.webkitFullscreenElement:`);
    console.log(webkitFullscreenElement);
    console.log('');
    
    // Expression 6: window.matchMedia('(display-mode: fullscreen)').matches
    const displayModeFullscreen = await page.evaluate(() => 
      window.matchMedia('(display-mode: fullscreen)').matches
    );
    console.log(`6) window.matchMedia('(display-mode: fullscreen)').matches:`);
    console.log(displayModeFullscreen);
    console.log('');
    
    // Expression 7: document.pointerLockElement
    const pointerLockElement = await page.evaluate(() => 
      document.pointerLockElement ? document.pointerLockElement.tagName : null
    );
    console.log(`7) document.pointerLockElement:`);
    console.log(pointerLockElement);
    console.log('');
    
    // Expression 8: window.outerHeight === screen.height
    const heightMatch = await page.evaluate(() => 
      window.outerHeight === screen.height
    );
    console.log(`8) window.outerHeight === screen.height:`);
    console.log(heightMatch);
    console.log('');
    
    // Console logs
    console.log('\n📋 Console logs from page:');
    if (consoleLogs.length > 0) {
      consoleLogs.forEach(log => console.log(log));
    } else {
      console.log('(No console logs captured)');
    }
    
    // Visual inspection note
    console.log('\n👁️  Visual inspection:');
    console.log('Please check the screenshot file for visual confirmation of overlay.');
    console.log('Waiting 5 seconds for visual inspection...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  const urls = [
    'https://aurora-site-2kmom9qj1-adrianos-projects-dd408230.vercel.app',
    'https://aurora-site-brown.vercel.app'
  ];
  
  for (const url of urls) {
    await testURL(url);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed!');
  console.log('='.repeat(80));
}

main();
