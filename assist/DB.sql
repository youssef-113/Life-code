-- DB Tables for lifecode app 
-- fist the user to store all about  personal info
 
                                                    -- ==========================================
                                                                -- USERS TABLE
                                                    -- ==========================================
CREATE TABLE Users (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255),
    PasswordSalt VARCHAR(255),
    GoogleID VARCHAR(255),           -- NULL if user signs up normally
    Email VARCHAR(100) UNIQUE NOT NULL,
    Gender ENUM('male', 'female'),
    NationalID VARCHAR(20),
    PhotoURL TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_googleID ON Users(GoogleID);
CREATE INDEX idx_email ON Users(Email);


                                                    -- ==================================================================
                                                    -- SESSIONS TABLE (Stores cookies + auth tokens)
                                                    -- ==================================================================
CREATE TABLE UserSessions (
    ID SERIAL PRIMARY KEY,
    UserID INT NOT NULL REFERENCES Users(ID) ON DELETE CASCADE,
    SessionToken VARCHAR(255) UNIQUE NOT NULL,
    RefreshToken VARCHAR(255) UNIQUE NOT NULL,
    UserAgent TEXT,
    IPAddress VARCHAR(45),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    ExpiresAt TIMESTAMP NOT NULL,
    LastUsed TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_userID ON UserSessions(UserID);
CREATE INDEX idx_session_token ON UserSessions(SessionToken);

                                                    -- ============================================================
                                                    -- AUDIT LOG TABLE (Security recommended)
                                                    -- Logs: login, logout, password change, failed attempts
                                                    -- ============================================================
CREATE TABLE SecurityLogs (
    LogID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT,
    ActionType ENUM(
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_CHANGED'
    ) NOT NULL,
    IPAddress VARCHAR(45),
    UserAgent TEXT,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE SET NULL
);


                                                            -- ======================================================
                                                            -- DEVICE TOKENS TABLE (For multi-device login)
                                                            -- ======================================================
CREATE TABLE Devices (
    DeviceID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    DeviceName VARCHAR(100),
    DeviceToken VARCHAR(300) UNIQUE,
    LastUsed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
);

                                                                -- ==============================================
                                                                -- WRISTBANDS TABLE
                                                                -- ==============================================
CREATE TABLE Wristbands (
    ID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    QRCode VARCHAR(255) UNIQUE NOT NULL,
    NFCTag VARCHAR(255) UNIQUE NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    IsRevoked BOOLEAN DEFAULT FALSE,   -- Security: disable a wristband
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_wristbands_userID ON Wristbands(UserID);
CREATE INDEX idx_wristbands_qr ON Wristbands(QRCode);
CREATE INDEX idx_wristbands_nfc ON Wristbands(NFCTag);


                                                            -- ==========================================
                                                            -- MEDICAL INFO TABLE
                                                            -- ==========================================
CREATE TABLE MedicalInfo (
    ID SERIAL PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,  -- one-to-one relationship
    BloodType VARCHAR(5),
    ChronicDiseases TEXT,
    Allergies TEXT,
    Medications TEXT,
    Notes TEXT,
    UpdatedAt TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_medical_userID ON MedicalInfo(UserID);


                                                            -- ==========================================
                                                            -- EMERGENCY CONTACTS TABLE
                                                            -- ==========================================
CREATE TABLE EmergencyContacts (
    ID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    ContactName VARCHAR(100) NOT NULL,
    Relation VARCHAR(50),
    PhoneNumber VARCHAR(20) NOT NULL,
    SecondaryPhone VARCHAR(20),
    IsPrimary BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_emergency_userID ON EmergencyContacts(UserID);
