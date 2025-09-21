# Spoticar
### This project was created as the final assignment for the course "Generative Design Programming" at the Masaryk University, Faculty of Informatics, Brno, Czech Republic.

## Trailer

https://github.com/user-attachments/assets/8a2cf5fb-8262-4191-8bb1-f2fe177c4bf8

## Description
Spoticar is a web application for visualizing race of cars, that are being synced with audio from Spotify and microphone. Root folder contains backend side, that uses Express.js for providing REST API and serving static files. Frontend side is located in `client` folder and is created using React.js and P5.js, with help of more smaller libraries.

I you want to start the application, you need to firstly route audio trough virtual audio devices and maybe tweak it on the way. It needs to go like this:
 
```Browser audio output (Spotify) -> Virtual Audio Cable``` 
- ```-> Microphone that browser can use``` 
- ```-> Your speakers or other output device```

Main P5 sketch file is located in `client/src/visualizers/audio-racing-p5.ts`

## Installation
1. Clone this repository
2. Install dependencies using `npm install` in root folder and `npm install` in `client` folder
3. Build frontend using `npm run build` in `client` folder
4. Start backend using `npm start` in root folder
5. Open `localhost:3000` in your browser (or whatever port you specified in `.env` file)
6. Enjoy!
