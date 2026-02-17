# API Implementation Examples

**Version:** 1.0.0  
**Last Updated:** February 9, 2026

Complete examples of calling all Healthcare API endpoints from different platforms.

---

## 📋 Table of Contents

1. [cURL Examples](#curl-examples)
2. [JavaScript/Node.js Examples](#javascriptnode-examples)
3. [Python Examples](#python-examples)
4. [iOS Swift Examples](#ios-swift-examples)
5. [Android Kotlin Examples](#android-kotlin-examples)

---

## cURL Examples

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "idToken": "firebase-id-token-here"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "uuid-string"
    }
  }
}
```

### Get User Profile (with token)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create Medical Info (with token)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/medical \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bloodType": "A+",
    "chronicDiseases": "Diabetes Type 2",
    "allergies": "Penicillin",
    "medications": "Metformin 500mg",
    "notes": "Take medication with food"
  }'
```

### Create Emergency Contact (with token)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/emergency \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "Jane Doe",
    "relation": "Spouse",
    "phoneNumber": "+20123456789",
    "isPrimary": true
  }'
```

### Get All Emergency Contacts (with token)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/emergency \
  -H "Authorization: Bearer $TOKEN"
```

### Logout

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\": \"$TOKEN\"}"
```

---

## JavaScript/Node Examples

### Login & Store Token

```javascript
const BASE_URL = 'http://localhost:3000/api';

async function login(email, idToken) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        idToken: idToken
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      console.log('Login successful');
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

### Get User Profile

```javascript
async function getUserProfile() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('User Profile:', data.data.user);
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}
```

### Create/Update Medical Info

```javascript
async function saveMedicalInfo(medicalData) {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${BASE_URL}/medical`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bloodType: medicalData.bloodType,
        chronicDiseases: medicalData.chronicDiseases,
        allergies: medicalData.allergies,
        medications: medicalData.medications,
        notes: medicalData.notes
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Medical info saved:', data.data.medicalInfo);
      return data.data.medicalInfo;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error saving medical info:', error);
    throw error;
  }
}
```

### Add Emergency Contact

```javascript
async function addEmergencyContact(contact) {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${BASE_URL}/emergency`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contactName: contact.name,
        relation: contact.relation,
        phoneNumber: contact.phone,
        secondaryPhone: contact.secondaryPhone || null,
        isPrimary: contact.isPrimary || false
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Contact added:', data.data.contact);
      return data.data.contact;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
}
```

### Get All Emergency Contacts

```javascript
async function getEmergencyContacts() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${BASE_URL}/emergency`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Contacts:', data.data.contacts);
      console.log('Primary Contact:', data.data.primaryContact);
      return data.data.contacts;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}
```

### Update Emergency Contact

```javascript
async function updateContact(contactId, updates) {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${BASE_URL}/emergency/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Contact updated:', data.data.contact);
      return data.data.contact;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}
```

### Delete Contact

```javascript
async function deleteContact(contactId) {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${BASE_URL}/emergency/${contactId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Contact deleted');
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
}
```

### Logout

```javascript
async function logout() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionToken: token
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Clear stored tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      console.log('Logout successful');
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}
```

### Refresh Token

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      
      console.log('Token refreshed');
      return data.data.tokens;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}
```

---

## Python Examples

### Login

```python
import requests
import json

BASE_URL = 'http://localhost:3000/api'

def login(email, id_token):
    """Authenticate user and get tokens"""
    response = requests.post(
        f'{BASE_URL}/auth/login',
        headers={'Content-Type': 'application/json'},
        json={
            'email': email,
            'idToken': id_token
        }
    )
    
    data = response.json()
    
    if data['success']:
        print('Login successful')
        return data['data']['tokens']
    else:
        print(f"Login failed: {data['message']}")
        raise Exception(data['message'])

# Usage
tokens = login('john.doe@example.com', 'firebase-id-token-here')
access_token = tokens['accessToken']
refresh_token = tokens['refreshToken']
```

### Get User Profile

```python
def get_profile(access_token):
    """Get current user's profile"""
    response = requests.get(
        f'{BASE_URL}/users/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    data = response.json()
    
    if data['success']:
        print('Profile:', data['data']['user'])
        return data['data']['user']
    else:
        print(f"Error: {data['message']}")
        raise Exception(data['message'])

# Usage
profile = get_profile(access_token)
```

### Save Medical Information

```python
def save_medical_info(access_token, medical_data):
    """Create or update medical information"""
    response = requests.post(
        f'{BASE_URL}/medical',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        json={
            'bloodType': medical_data.get('bloodType'),
            'chronicDiseases': medical_data.get('chronicDiseases'),
            'allergies': medical_data.get('allergies'),
            'medications': medical_data.get('medications'),
            'notes': medical_data.get('notes')
        }
    )
    
    data = response.json()
    
    if data['success']:
        print('Medical info saved:', data['data']['medicalInfo'])
        return data['data']['medicalInfo']
    else:
        print(f"Error: {data['message']}")
        raise Exception(data['message'])

# Usage
medical_data = {
    'bloodType': 'A+',
    'chronicDiseases': 'Diabetes Type 2',
    'allergies': 'Penicillin',
    'medications': 'Metformin 500mg',
    'notes': 'Take with food'
}
save_medical_info(access_token, medical_data)
```

### Add Emergency Contact

```python
def add_emergency_contact(access_token, contact_data):
    """Add a new emergency contact"""
    response = requests.post(
        f'{BASE_URL}/emergency',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        json={
            'contactName': contact_data['name'],
            'relation': contact_data.get('relation'),
            'phoneNumber': contact_data['phone'],
            'secondaryPhone': contact_data.get('secondary_phone'),
            'isPrimary': contact_data.get('is_primary', False)
        }
    )
    
    data = response.json()
    
    if data['success']:
        print('Contact added:', data['data']['contact'])
        return data['data']['contact']
    else:
        print(f"Error: {data['message']}")
        raise Exception(data['message'])

# Usage
contact_data = {
    'name': 'Jane Doe',
    'relation': 'Spouse',
    'phone': '+20123456789',
    'secondary_phone': '+20198765432',
    'is_primary': True
}
add_emergency_contact(access_token, contact_data)
```

### Get All Emergency Contacts

```python
def get_emergency_contacts(access_token):
    """Get all emergency contacts for user"""
    response = requests.get(
        f'{BASE_URL}/emergency',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    data = response.json()
    
    if data['success']:
        print(f"Found {data['data']['count']} contacts")
        print('Contacts:', data['data']['contacts'])
        print('Primary Contact:', data['data']['primaryContact'])
        return data['data']['contacts']
    else:
        print(f"Error: {data['message']}")
        raise Exception(data['message'])

# Usage
contacts = get_emergency_contacts(access_token)
```

### Update Emergency Contact

```python
def update_contact(access_token, contact_id, updates):
    """Update an emergency contact"""
    response = requests.put(
        f'{BASE_URL}/emergency/{contact_id}',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        json=updates
    )
    
    data = response.json()
    
    if data['success']:
        print('Contact updated:', data['data']['contact'])
        return data['data']['contact']
    else:
        print(f"Error: {data['message']}")
        raise Exception(data['message'])

# Usage
updates = {'phoneNumber': '+20166666666', 'isPrimary': True}
update_contact(access_token, 'contact-id-here', updates)
```

### Delete Contact

```python
def delete_contact(access_token, contact_id):
    """Delete an emergency contact"""
    response = requests.delete(
        f'{BASE_URL}/emergency/{contact_id}',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    data = response.json()
    
    if data['success']:
        print('Contact deleted')
        return True
    else:
        print(f"Error: {data['message']}")
        raise Exception(data['message'])

# Usage
delete_contact(access_token, 'contact-id-here')
```

### Logout

```python
def logout(access_token):
    """Logout from current session"""
    response = requests.post(
        f'{BASE_URL}/auth/logout',
        headers={'Content-Type': 'application/json'},
        json={'sessionToken': access_token}
    )
    
    data = response.json()
    
    if data['success']:
        print('Logout successful')
        return True
    else:
        print(f"Error: {data['message']}")
        raise Exception(data['message'])

# Usage
logout(access_token)
```

---

## iOS Swift Examples

### Login

```swift
import Foundation

let baseURL = "http://localhost:3000/api"

func login(email: String, idToken: String, completion: @escaping (Result<LoginResponse, Error>) -> Void) {
    let url = URL(string: "\(baseURL)/auth/login")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = [
        "email": email,
        "idToken": idToken
    ]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        
        guard let data = data else {
            completion(.failure(NSError(domain: "No data", code: -1)))
            return
        }
        
        do {
            let response = try JSONDecoder().decode(LoginResponse.self, from: data)
            completion(.success(response))
            
            // Save tokens
            UserDefaults.standard.set(response.data.tokens.accessToken, forKey: "accessToken")
            UserDefaults.standard.set(response.data.tokens.refreshToken, forKey: "refreshToken")
        } catch {
            completion(.failure(error))
        }
    }.resume()
}

// Usage
login(email: "john@example.com", idToken: "firebase-token") { result in
    switch result {
    case .success(let response):
        print("Login successful: \(response.data.user)")
    case .failure(let error):
        print("Login failed: \(error)")
    }
}
```

### Get User Profile

```swift
func getProfile(accessToken: String, completion: @escaping (Result<User, Error>) -> Void) {
    let url = URL(string: "\(baseURL)/users/me")!
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        
        guard let data = data else {
            completion(.failure(NSError(domain: "No data", code: -1)))
            return
        }
        
        do {
            let response = try JSONDecoder().decode(ProfileResponse.self, from: data)
            completion(.success(response.data.user))
        } catch {
            completion(.failure(error))
        }
    }.resume()
}

// Usage
if let token = UserDefaults.standard.string(forKey: "accessToken") {
    getProfile(accessToken: token) { result in
        switch result {
        case .success(let user):
            print("User: \(user.username)")
        case .failure(let error):
            print("Error: \(error)")
        }
    }
}
```

### Add Emergency Contact

```swift
func addEmergencyContact(
    accessToken: String,
    contact: ContactData,
    completion: @escaping (Result<Contact, Error>) -> Void
) {
    let url = URL(string: "\(baseURL)/emergency")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = [
        "contactName": contact.name,
        "relation": contact.relation ?? "",
        "phoneNumber": contact.phone,
        "secondaryPhone": contact.secondaryPhone ?? NSNull(),
        "isPrimary": contact.isPrimary ?? false
    ]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        
        guard let data = data else {
            completion(.failure(NSError(domain: "No data", code: -1)))
            return
        }
        
        do {
            let response = try JSONDecoder().decode(ContactResponse.self, from: data)
            completion(.success(response.data.contact))
        } catch {
            completion(.failure(error))
        }
    }.resume()
}

// Usage
let contact = ContactData(
    name: "Jane Doe",
    relation: "Spouse",
    phone: "+20123456789",
    secondaryPhone: "+20198765432",
    isPrimary: true
)

if let token = UserDefaults.standard.string(forKey: "accessToken") {
    addEmergencyContact(accessToken: token, contact: contact) { result in
        switch result {
        case .success(let contact):
            print("Contact added: \(contact.contactName)")
        case .failure(let error):
            print("Error: \(error)")
        }
    }
}
```

---

## Android Kotlin Examples

### Login

```kotlin
import retrofit2.http.POST
import retrofit2.http.Body
import retrofit2.Call
import com.google.gson.annotations.SerializedName

interface HealthcareApi {
    @POST("auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>
    
    @POST("emergency")
    fun addEmergencyContact(
        @Header("Authorization") token: String,
        @Body contact: EmergencyContactRequest
    ): Call<ContactResponse>
    
    @GET("emergency")
    fun getEmergencyContacts(
        @Header("Authorization") token: String
    ): Call<ContactsResponse>
}

data class LoginRequest(
    val email: String,
    val idToken: String
)

data class LoginResponse(
    val success: Boolean,
    val data: LoginData
)

data class LoginData(
    val tokens: Tokens
)

data class Tokens(
    val accessToken: String,
    val refreshToken: String
)

class LoginActivity : AppCompatActivity() {
    private lateinit var retrofit: Retrofit
    private lateinit var api: HealthcareApi
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        retrofit = Retrofit.Builder()
            .baseUrl("http://localhost:3000/api/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        api = retrofit.create(HealthcareApi::class.java)
    }
    
    fun login(email: String, idToken: String) {
        val request = LoginRequest(email, idToken)
        api.login(request).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                if (response.isSuccessful && response.body()?.success == true) {
                    val tokens = response.body()?.data?.tokens
                    // Store tokens
                    val sharedPref = getSharedPreferences("auth", Context.MODE_PRIVATE)
                    sharedPref.edit().apply {
                        putString("accessToken", tokens?.accessToken)
                        putString("refreshToken", tokens?.refreshToken)
                        apply()
                    }
                    Log.d("Login", "Success")
                }
            }
            
            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                Log.e("Login", "Failed: ${t.message}")
            }
        })
    }
}
```

### Add Emergency Contact

```kotlin
data class EmergencyContactRequest(
    val contactName: String,
    val relation: String?,
    val phoneNumber: String,
    val secondaryPhone: String?,
    val isPrimary: Boolean
)

data class ContactResponse(
    val success: Boolean,
    val data: ContactData
)

data class ContactData(
    val contact: EmergencyContact
)

data class EmergencyContact(
    val id: String,
    val contactName: String,
    val relation: String?,
    val phoneNumber: String,
    val secondaryPhone: String?,
    val isPrimary: Boolean,
    val createdAt: String
)

class EmergencyContactActivity : AppCompatActivity() {
    private lateinit var api: HealthcareApi
    
    fun addContact(contact: EmergencyContactRequest) {
        val sharedPref = getSharedPreferences("auth", Context.MODE_PRIVATE)
        val token = sharedPref.getString("accessToken", "") ?: ""
        
        api.addEmergencyContact("Bearer $token", contact)
            .enqueue(object : Callback<ContactResponse> {
                override fun onResponse(
                    call: Call<ContactResponse>,
                    response: Response<ContactResponse>
                ) {
                    if (response.isSuccessful && response.body()?.success == true) {
                        val addedContact = response.body()?.data?.contact
                        Log.d("Contact", "Added: ${addedContact?.contactName}")
                        // Update UI
                    }
                }
                
                override fun onFailure(call: Call<ContactResponse>, t: Throwable) {
                    Log.e("Contact", "Failed: ${t.message}")
                }
            })
    }
}
```

### Get Emergency Contacts

```kotlin
data class ContactsResponse(
    val success: Boolean,
    val data: ContactsData
)

data class ContactsData(
    val contacts: List<EmergencyContact>,
    val count: Int,
    val primaryContact: EmergencyContact?
)

fun getContacts() {
    val sharedPref = getSharedPreferences("auth", Context.MODE_PRIVATE)
    val token = sharedPref.getString("accessToken", "") ?: ""
    
    api.getEmergencyContacts("Bearer $token")
        .enqueue(object : Callback<ContactsResponse> {
            override fun onResponse(
                call: Call<ContactsResponse>,
                response: Response<ContactsResponse>
            ) {
                if (response.isSuccessful && response.body()?.success == true) {
                    val contacts = response.body()?.data?.contacts ?: emptyList()
                    val primaryContact = response.body()?.data?.primaryContact
                    
                    Log.d("Contacts", "Count: ${contacts.size}")
                    Log.d("Contacts", "Primary: ${primaryContact?.contactName}")
                    // Update UI with contacts list
                }
            }
            
            override fun onFailure(call: Call<ContactsResponse>, t: Throwable) {
                Log.e("Contacts", "Failed: ${t.message}")
            }
        })
}
```

---

## Error Handling Examples

### Handle API Errors

```javascript
async function handleApiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    // Check if request was successful
    if (!data.success) {
      // Handle specific error types
      switch (data.code) {
        case 400:
          console.error('Validation Error:', data.message);
          // Show validation error to user
          break;
        
        case 401:
          console.error('Unauthorized:', data.message);
          // Token expired or invalid - redirect to login
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          break;
        
        case 403:
          console.error('Forbidden:', data.message);
          // User doesn't have permission
          break;
        
        case 404:
          console.error('Not Found:', data.message);
          // Resource doesn't exist
          break;
        
        case 500:
          console.error('Server Error:', data.message);
          // Server error - show user-friendly message
          break;
        
        default:
          console.error('Error:', data.message);
      }
      
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Usage
try {
  const profile = await handleApiCall('http://localhost:3000/api/users/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log(profile);
} catch (error) {
  // Handle error
}
```

---

## Summary

All platforms follow the same pattern:
1. Send HTTP request with correct method and headers
2. Include Authorization header with Bearer token for protected endpoints
3. Send JSON body for POST/PUT/PATCH requests
4. Handle response based on `success` flag
5. Store tokens in secure storage for future requests

For more details, see `API_DOCUMENTATION.md` and `DATABASE_SCHEMA_MAPPING.md`.

---

**API Version:** 1.0.0  
**Last Updated:** February 9, 2026
