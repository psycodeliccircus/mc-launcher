/**
 * @author RenildoMarcio <renildomrc@gmail.com>
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
const { ipcRenderer } = require('electron');
import { config } from './utils.js';

let dev = process.env.NODE_ENV === 'dev';


class Splash {
    constructor() {
        this.splash = document.querySelector(".splash");
        this.splashMessage = document.querySelector(".splash-message");
        this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector("progress");
        document.addEventListener('DOMContentLoaded', () => this.startAnimation());
    }

    async startAnimation() {
        let splashes = [
            { "message": "MC Launcher: sua porta para aventuras infinitas no Minecraft.", "author": "RenildoMarcioAI" },
            { "message": "Explore, construa e jogue com o MC Launcher.", "author": "RenildoMarcioAI" },
            { "message": "Jogue Minecraft ao máximo com o MC Launcher.", "author": "RenildoMarcioAI" },
            { "message": "MC Launcher: sua entrada para o universo do Minecraft.", "author": "RenildoMarcioAI" },
            { "message": "Descubra o Minecraft com o MC Launcher.", "author": "RenildoMarcioAI" },
            { "message": "Jogue Minecraft com facilidade usando o MC Launcher.", "author": "RenildoMarcioAI" }
        ]
        let splash = splashes[Math.floor(Math.random() * splashes.length)];
        this.splashMessage.textContent = splash.message;
        this.splashAuthor.children[0].textContent = "@" + splash.author;
        await sleep(100);
        document.querySelector("#splash").style.display = "block";
        await sleep(500);
        this.splash.classList.add("opacity");
        await sleep(500);
        this.splash.classList.add("translate");
        this.splashMessage.classList.add("opacity");
        this.splashAuthor.classList.add("opacity");
        this.message.classList.add("opacity");
        await sleep(1000);
        this.checkUpdate();
    }

    async checkUpdate() {
        if (dev) return this.startLauncher();
        this.setStatus(`pesquisa de atualização...`);

        ipcRenderer.invoke('update-app').then(err => {
            if (err.error) {
                let error = err.message;
                this.shutdown(`erro ao procurar atualização:<br>${error}`);
            }
        })

        ipcRenderer.on('updateAvailable', () => {
            this.setStatus(`Atualização disponível!`);
            this.toggleProgress();
            ipcRenderer.send('start-update');
        })

        ipcRenderer.on('download-progress', (event, progress) => {
            this.setProgress(progress.transferred, progress.total);
        })

        ipcRenderer.on('update-not-available', () => {
            this.maintenanceCheck();
        })
    }

    async maintenanceCheck() {
        config.GetConfig().then(res => {
            if (res.maintenance) return this.shutdown(res.maintenance_message);
            this.startLauncher();
        }).catch(e => {
            console.error(e);
            return this.shutdown("Nenhuma conexão com a Internet detectada,<br>tente novamente mais tarde.");
        })
    }

    startLauncher() {
        this.setStatus(`Iniciar o launcher`);
        ipcRenderer.send('main-window-open');
        ipcRenderer.send('update-window-close');
    }

    shutdown(text) {
        this.setStatus(`${text}<br>Parar em 5s`);
        let i = 4;
        setInterval(() => {
            this.setStatus(`${text}<br>Pare em ${i--}s`);
            if (i < 0) ipcRenderer.send('update-window-close');
        }, 1000);
    }

    setStatus(text) {
        this.message.innerHTML = text;
    }

    toggleProgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    setProgress(value, max) {
        this.progress.value = value;
        this.progress.max = max;
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        ipcRenderer.send("update-window-dev-tools");
    }
})
new Splash();