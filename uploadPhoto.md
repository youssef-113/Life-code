
POST /api/app/user/photo
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Body (form-data):
- Key: photo (type: File)
- Value: Select your photo.jpg or photo.png


Flutter/Dart Example:

```dart
import 'package:http/http.dart' as http;
 
Future<void> uploadPhoto(String filePath) async {
    ````
  final uri = Uri.parse('$baseUrl/user/photo');
  
  final request = http.MultipartRequest('POST', uri)
    ..headers['Authorization'] = 'Bearer $sessionToken';
  
  // Add the FILE, not JSON body
  request.files.add(await http.MultipartFile.fromPath(
    'photo',  // <-- FIELD NAME MUST BE 'photo'
    filePath,
    filename: 'photo.jpg',
  ));
  
  final response = await request.send();
  final respStr = await response.stream.bytesToString();
  print(respStr);
}


Get Photo:


GET /api/app/user/photo
Authorization: Bearer <token>
Response (all endpoints):

json
```{
  "success": true,
  "data": {
    "userID": "abc123",
    "photoURL": "https://res.cloudinary.com/...",
    "photoType": "cloudinary",
    "uploadedAt": "2026-04-05T..."
  }
}
```
All field names are already standardized as photo (for file) and photoURL (for URL) across the entire flow.