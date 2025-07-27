# Blueberry Loom Form Loader
Statically-compiled form loader for Blueberry Loom made using Nuxt3/Vue3.

The main app that uses the loader is hosted at https://blueberry-loom.netlify.app/

## How to run

1. Configure the main app:

    Visit the [https://github.com/Northstrix/blueberry-loom](https://github.com/Northstrix/blueberry-loom) repository and set up the Next.js app

2. Clone the repository using the command:

    ```
    git clone https://github.com/Northstrix/blueberry-loom-form-loader
    ```
    
3. Open the project:

    - Open the cloned folder in VS Code or any IDE of your choice.

4. Configure Firebase Access:

    - Open `plugins/firebase.client.ts` file.
    - Replace the mock credentials there with the same ones you've used in the [Next.js app](https://github.com/Northstrix/blueberry-loom).

5. Install dependencies by running:

    ```
    npm install
    ```

6. Start the development server with:

    ```
    npm run dev -- --host
    ```

7. Repalce the base URL of the [Next.js app](https://github.com/Northstrix/blueberry-loom) within the loader with your own (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> -> https://blueberry-loom.netlify.app/)
