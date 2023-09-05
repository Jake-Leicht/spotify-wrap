import { getSpotifyData, TESTING_MAIN_URI, TESTING_REDIRECT_URI} from "./script";

const CLIENT_INPUT = <HTMLInputElement> document.getElementById("client-id-input");
CLIENT_INPUT.addEventListener("input", () => {
    localStorage.setItem("clientId", CLIENT_INPUT.value);
});
CLIENT_INPUT.addEventListener("keydown", (event: any) =>{
    if(event.key == "Enter"){
        const verify = verifyInput(localStorage.getItem("clientId"));
        if(verify === true){
            clearInput();
            getSpotifyData(localStorage.getItem("clientId"));
        }
    }
});

export function clearInput(){
    CLIENT_INPUT.value = "";
}

export function verifyInput(text: string){
    if(text){
        return true;
    }else{
        return false;
    }
}

const TIME_FRAME_INPUT = <HTMLSelectElement> document.getElementById("timeframe-input");
TIME_FRAME_INPUT.addEventListener("change", () => {
    localStorage.setItem("timeframe", TIME_FRAME_INPUT.value);
});

var delay: number = 30000;  // * 30,000 ms === 0.5 minutes
var timer: any = null;
window.addEventListener("mousemove", () => {
    if (timer) clearTimeout(timer);
        timer = setTimeout(function(){
            localStorage.clear();
            document.location = TESTING_MAIN_URI;
    }, delay);
});

window.onload = () => {
    document.getElementById("body").scrollIntoView();

    switch(localStorage.getItem("progression")){
        case null:
            console.log(`progression: null`);
            localStorage.setItem("progression", "intro");
            break;
        case "intro":
            console.log(`progression: intro`);
            break;
        case "dashboard":   // ! Stuck loop if user uses 'back arrow' or cancels the request (takes 2 attempts to return to main)
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

// * Clip board
document.getElementById("copy_url-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(
        TESTING_REDIRECT_URI
    );
    alert(`'${TESTING_REDIRECT_URI}' has been copied to your clipboard`);
});
