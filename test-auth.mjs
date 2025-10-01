import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3000';

async function testAuth() {
  console.log('🔍 Testing Authentication Flow...\n');

  try {
    // Step 1: Get CSRF token
    console.log('1. Getting CSRF token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfCookies = csrfResponse.headers.get('set-cookie') || '';
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ CSRF Token obtained:', csrfToken.substring(0, 20) + '...');
    console.log('✅ CSRF Cookies:', csrfCookies ? csrfCookies.substring(0, 50) + '...' : 'None');
    console.log();

    // Step 2: Login with credentials
    console.log('2. Attempting login with credentials...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookies
      },
      body: new URLSearchParams({
        csrfToken: csrfToken,
        email: 'admin@4sda.com',
        password: 'admin123',
        redirect: 'false',
        json: 'true'
      }),
      redirect: 'manual'
    });

    console.log('Response status:', loginResponse.status);
    console.log('Response headers:', Object.fromEntries(loginResponse.headers.entries()));

    const cookies = loginResponse.headers.raw()['set-cookie'];
    console.log('Cookies:', cookies ? cookies.join('; ').substring(0, 100) + '...' : 'None');

    // Step 3: Get session
    if (cookies) {
      console.log('\n3. Getting session with auth cookie...');

      // Extract just the cookie values without attributes
      const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
      console.log('Cookie header:', cookieHeader.substring(0, 100) + '...');

      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          'Cookie': cookieHeader
        }
      });
      const session = await sessionResponse.json();
      console.log('✅ Session data:', JSON.stringify(session, null, 2));

      if (session && session.user) {
        console.log('\n✅ Authentication successful!');
        console.log('User ID:', session.user.id);
        console.log('User Email:', session.user.email);
        console.log('User Name:', session.user.name);
        console.log('User Role:', session.user.role);
      } else {
        console.log('\n⚠️ Session is null or missing user data');
      }
    } else {
      console.log('❌ No cookies received - login may have failed');
      const responseText = await loginResponse.text();
      console.log('Response body:', responseText);
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testAuth();
