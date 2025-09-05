// Shared test module for k6 browser tests
import { check } from 'k6';
import { browser } from 'k6/browser';
import {
  checkPageLoad,
  getAuthToken,
  getBaseUrl,
  safeClick,
  selectors,
  setAuthCookies,
  thinkTime,
  waitForAngular,
  waitForNavigation,
} from './config.js';

export async function runTest(isStressTest = false) {
  const baseUrl = getBaseUrl();
  const page = await browser.newPage();

  try {
    if (isStressTest) {
      console.log(`Stress test - VU ${__VU}: Starting test on ${baseUrl}`);
    }

    // Navigate to the Angular app
    const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Use shared page load check
    await checkPageLoad(page, response);

    // Wait for Angular to load
    await waitForAngular(page);

    // Login by setting auth cookies
    const cookiesSet = await setAuthCookies(page.context(), baseUrl);
    if (cookiesSet) {
      if (isStressTest) {
        console.log(`VU ${__VU}: Auth cookies set`);
      } else {
        console.log('Auth cookies set');
      }
      // Refresh page to apply login
      await page.reload({ waitUntil: 'networkidle' });
      await waitForAngular(page);
    }

    if (isStressTest) {
      // Track page load performance
      const loadTime = await page.evaluate(() => {
        return performance.timing.loadEventEnd - performance.timing.navigationStart;
      });
      console.log(`VU ${__VU}: Page load time: ${loadTime}ms`);
    }

    // Check if user is logged in by looking for user menu or profile elements
    const loginButton = await page.locator(selectors.loginButton).first();
    const userMenu = await page.locator(selectors.userMenu).first();
    const userProfileImage = await page.locator(selectors.userProfileImage).first();

    // User is logged in if login button is hidden OR user menu/profile elements are visible
    const loginButtonHidden = await loginButton.isHidden();
    const userMenuVisible = await userMenu.isVisible();
    const userProfileVisible = await userProfileImage.isVisible();

    const isLoggedIn = loginButtonHidden || userMenuVisible || userProfileVisible;

    check(page, {
      'user is logged in': () => isLoggedIn,
    });

    // If logged in, perform additional user actions
    if (isLoggedIn) {
      // Navigate to communities page
      if (await safeClick(page, selectors.communitiesLink)) {
        await waitForNavigation(page);
        if (isStressTest) {
          console.log(`VU ${__VU}: Navigated to communities`);
        } else {
          console.log('Navigated to communities');
        }
        await thinkTime(isStressTest ? 500 : 1000, isStressTest ? 1500 : 3000);
      }

      // Navigate to builds page
      if (await safeClick(page, selectors.buildsLink)) {
        await waitForNavigation(page);
        if (isStressTest) {
          console.log(`VU ${__VU}: Navigated to builds`);
        } else {
          console.log('Navigated to builds');
        }
        await thinkTime(isStressTest ? 500 : 1000, isStressTest ? 1500 : 3000);
      }

      // Try to interact with search if available
      const searchBox = await page.locator(selectors.searchBox).first();
      if (await searchBox.isVisible()) {
        await searchBox.fill('react');
        await searchBox.press('Enter');
        if (isStressTest) {
          console.log(`VU ${__VU}: Performed search`);
        } else {
          console.log('Performed search');
        }
        await thinkTime(isStressTest ? 500 : 1000, isStressTest ? 1500 : 3000);
      }
    } else {
      // If not logged in, the test will still work but with limited interactions
      if (isStressTest) {
        console.log(`VU ${__VU}: User not logged in, proceeding with basic navigation`);
      }
    }

    // Simple interaction - click on a navigation link if it exists
    const navSuccess = await safeClick(page, selectors.navLinks);
    if (navSuccess) {
      await waitForNavigation(page);
      if (isStressTest) {
        console.log(`VU ${__VU}: Navigation successful`);
      }
    } else {
      if (isStressTest) {
        console.log(`VU ${__VU}: No navigation links found or click failed`);
      }
    }

    // Simulate user think time (shorter for stress test)
    await thinkTime(isStressTest ? 500 : 1000, isStressTest ? 1500 : 3000);

    // Check page responsiveness
    const title = await page.title();
    check(page, {
      'page title exists': () => title.length > 0,
      'page is responsive': () => title !== '',
    });

    if (isStressTest) {
      console.log(`VU ${__VU}: Test iteration completed - Title: ${title}`);
    } else {
      console.log(`Page title: ${title}`);
    }
  } catch (error) {
    if (isStressTest) {
      console.error(`VU ${__VU}: Error during test: ${error.message}`);
    } else {
      console.error(`Error during test: ${error.message}`);
    }
    throw error;
  } finally {
    await page.close();
  }
}
