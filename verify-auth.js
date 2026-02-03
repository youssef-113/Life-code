const BASE_URL = 'http://localhost:3001/api/auth';

async function test() {
    try {
        console.log('--- Testing Login ---');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@lifecode.com' })
        });

        if (!loginRes.ok) {
            const error = await loginRes.json();
            console.error('Login Failed:', error);
            return;
        }

        const loginData = await loginRes.json();
        console.log('Login Success:', loginData);

        if (loginData.accessToken) {
            console.log('\n--- Testing Logout ---');
            const logoutRes = await fetch(`${BASE_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken: loginData.accessToken })
            });

            const logoutData = await logoutRes.json();
            if (logoutRes.ok) {
                console.log('Logout Success:', logoutData);
            } else {
                console.error('Logout Failed:', logoutData);
            }
        }
    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

test();
