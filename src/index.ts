import { getSpotifyData } from "./script";

const CLIENT_INPUT = <HTMLInputElement> document.getElementById("client-id-input");
CLIENT_INPUT.addEventListener("input", () => {
    localStorage.setItem("clientId", CLIENT_INPUT.value);
});
CLIENT_INPUT.addEventListener("keydown", (event: any) =>{
    if(event.key == "Enter"){
        getSpotifyData(localStorage.getItem("clientId"));
    }
});

window.onload = () => {
    //localStorage.clear();
    document.getElementById("body").scrollIntoView();

    switch(localStorage.getItem("progression")){
        case null:
            console.log(`progression: null`);
            localStorage.setItem("progression", "intro");
            break;
        case "intro":
            console.log(`progression: intro`);
            break;
        case "dashboard":   // ! Stuck loop if user uses 'back arrow' or cancels the request
            console.log(`progression: dashboard`);
            showDashboard();
            getSpotifyData(localStorage.getItem("clientId"));
            break;
        default:
            console.log("default");
            break;
    }

    function showDashboard(){
        introElem.classList.add("hidden");
        instructionElem.classList.add("hidden");
        document.getElementById("body").scrollIntoView();
        dashboardElem.classList.remove("hide");
    }
}

window.onbeforeunload = () => {
    console.log("BEFORE CLOSING");
    if(localStorage.getItem("progression") === "intro"){
        return "Are you sure you want to leave";
    }
}

window.addEventListener("blur", () => document.title = "Why did you leave?");
window.addEventListener("focus", () => document.title = "Spotify Wrap");

const introBtn = document.getElementById("intro__btn");
const introElem = document.getElementById("intro__section");
const instructionElem = document.getElementById("instructions__section");
const dashboardElem = document.getElementById("dashboard__section");

const backBtn = document.getElementById("dashboard__home-btn");

backBtn.addEventListener("click", () => {localStorage.setItem("progression", "intro")});

// * Scroll to Section
introBtn.addEventListener("click", () => {instructionElem.scrollIntoView()});