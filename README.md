# This is the back end Express side of my full stack image to text japanese translation and text segmentation project.

Implimention of the front end was done in React.js
The back end is done in Express
The database is MongoDB
I have a Python flask server running MeCab, a Japanese text segmentation library

All components are running in seperate Docker containers. These containers are hosted in GCE.

Image to text AI/ML is done via Google Vision.
Text translation is done via DeepL.

Images can be uploaded or sent via links.

User profiles store image information, Japanese text, the Japanese to English translation and the segmented text.

User can update text segmentation and translation