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
>[!tip]
>Advised to use python version 3.11
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
>[!caution]
>change the alimbic and backend files to your sql credintials 

---
## Frontend setup

#### 4. React native setup
```bash
cd .\chat_app\
npm install
```

---
> [!IMPORTANT]
> Configure SDKs in SDK Manager<br/>
> _🔍 Open SDK Manager inside Android Studio<br/>
>   _📌 Go to the SDK Platforms tab and select these versions: ✅ Android 13.0 ("Tiramisu") – API 33-ext4<br/>
>     _✅ Android 12.0 ("S") – API 31 ___[Advised]___ <br/> 
>     _✅ Android 11.0 ("R") – API 30<br/>
>   _📌 Go to the SDK Tools tab and check these options: ✅ Android SDK Build-Tools 35<br/>
>     _✅ Android SDK Command-line Tools<br/>
>     _✅ Android Emulator<br/>
>     _✅ Android Emulator Hypervisor Driver (Installer)<br/>
>     _✅ Android SDK Platform-Tools<br/>
>     _✅ Google Play Services<br/>

## Run the app

>[!Note]
>if you are using npm
#### Starting the server
```bash
cd .\chat_App\
npm start
```
### Building the app
>In a new Ternimal
```bash
cd .\chat_App\
npm run android 
```

>[!Note]
>if you are using npx
#### Starting the server
```bash
cd .\chat_App\
npx react-native start
```
#### Building the app
>In a new Ternimal
```bash
cd .\chat_App\
npx react-native run-android 
```
---
### Start the server
```bash
cd ./bknd/
.\<your venv>\Scripts\activate
cd .\chat_App\
uvicorn app.main:app --reload
```





















