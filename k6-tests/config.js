// Shared configuration for k6 tests
export const defaultOptions = {
  scenarios: {
    browser_test: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export const stressOptions = {
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 5 }, // Ramp up to 5 users over 30s
        { duration: '1m', target: 5 }, // Stay at 5 users for 1 minute
        { duration: '30s', target: 10 }, // Ramp up to 10 users over 30s
        { duration: '1m', target: 10 }, // Stay at 10 users for 1 minute
        { duration: '30s', target: 0 }, // Ramp down to 0 users
      ],
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    browser_http_req_duration: ['p(95)<5000'], // 95% of requests should be under 5s
    browser_http_req_failed: ['rate<0.1'], // Less than 10% failure rate
    checks: ['rate>0.95'], // 95% of checks should pass
  },
};

export const getBaseUrl = () => __ENV.BASE_URL || 'https://www.commudle.com';

export const getAuthToken = () => __ENV.AUTH_TOKEN || 'your_auth_token_here';

// Set multiple auth cookies (found through Playwright inspection)
export const setAuthCookies = async (context, baseUrl) => {
  const authToken = getAuthToken();
  if (!authToken || authToken === 'your_auth_token_here') {
    return false;
  }

  // Extract hostname from baseUrl without using URL constructor
  const urlParts = baseUrl.replace('https://', '').replace('http://', '').split('/')[0];
  console.log(`Setting auth cookies for domain: ${urlParts}`);
  // Set the correct cookie name that works with Commudle
  await context.addCookies([
    {
      name: 'commudle_user_auth',
      value: authToken,
      domain: urlParts,
      path: '/',
    },
  ]);

  return true;
};

export const waitForAngular = async (page, timeout = 3000) => {
  await page.waitForTimeout(timeout);
};

export const checkPageLoad = async (page, response) => {
  const status = response.status();
  const title = await page.title();

  check(response, {
    'status is 200': () => status === 200,
  });

  check(page, {
    'page has title': () => title.length > 0,
  });
};

// Utility function to safely click elements
export const safeClick = async (page, selector, timeout = 5000) => {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    await element.click();
    return true;
  } catch (e) {
    console.log(`Could not click ${selector}: ${e.message}`);
    return false;
  }
};

// Utility function to wait for navigation
export const waitForNavigation = async (page) => {
  await page.waitForLoadState('networkidle');
};

// Utility function to simulate user think time
export const thinkTime = async (min = 1000, max = 3000) => {
  const delay = Math.random() * (max - min) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
};

// Common selectors for Commudle app
export const selectors = {
  navLinks: 'nav a, .navbar a, .menu a, header a',
  communitiesLink: 'a[href="/communities"], nb-action a[href="/communities"]',
  buildsLink: 'a[href="/builds"], nb-action a[href="/builds"]',
  loginButton: 'button.profile, button[title="Login / Signup"]',
  searchBox: 'input[placeholder*="Search"], app-search-box input',
  userMenu: '.user-profile-dropdown, .user-menu, [class*="user-profile"]',
  userProfileImage: '.user-profile-image, img[alt*="profile"]',
};
