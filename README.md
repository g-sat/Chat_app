# Chat Application Module

This is a **chat application module** that is part of a larger application. It enables the chat feature within the main app.
[develeped on Android using Android studio]
## Getting Started

Follow these steps to set up and run the application:

### 1. Clone the Repository
```bash
git clone https://github.com/g-sat/Chat_app.git
cd .\chat_app\
```

---
## Backend setup

#### 2. Create a virtual Environment(python3.11)
```bash
pip install venv
cd .\bknd\
Remove-Item .\env\ -Recurse -Force
python3.11 -m venv env
.\env\Scripts\activate
```

#### 3. Installing Python packages
```shell
pip install .\requirments.txt
```

---
## Frontend setup

#### 4. React native setup
```bash
cd .\chat_app\
npm install
```

---
> [!NOTE]
> Configure SDKs in SDK Manager<br>
>🔍 Open SDK Manager inside Android Studio<br>
> 📌 Go to the SDK Platforms tab and select these versions: ✅ Android 13.0 ("Tiramisu") – API 33-ext4<br>
> ✅ Android 12.0 ("S") – API 31<br>
> ✅ Android 11.0 ("R") – API 30<br>
>📌 Go to the SDK Tools tab and check these options: ✅ Android SDK Build-Tools 35<br>
> ✅ Android SDK Command-line Tools<br>
> ✅ Android Emulator<br>
> ✅ Android Emulator Hypervisor Driver (Installer)<br>
> ✅ Android SDK Platform-Tools<br>
> ✅ Google Play Services<br>

## Run the app
```bash























