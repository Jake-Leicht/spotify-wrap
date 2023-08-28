import { Chart } from 'chart.js/auto';

const submitBtn = <HTMLButtonElement> document.getElementById("instruction__submit-btn");
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

submitBtn.addEventListener("click", () => {
    getSpotifyData(localStorage.getItem("clientId"));
});

enum TIME_FRAME{
    SHORT = "short_term",
    MEDIUM = "medium_term",
    LONG = "long_term"
}

enum LIMIT{
    MIN = 0,
    DEFAULT = 10,
    MAX = 50
}

enum CATEGORY{
    TRACKS = "tracks",
    ARTISTS = "artists"
}

// ! Error Handling:
    // todo: If returned list is less than 10 => blank indexs

var TRACK_PAGINATION_INDEX: number = 0;
var ARTIST_PAGINATION_INDEX: number = 0;

export async function getSpotifyData(id: string){
    if (!code) {
        redirectToAuthCodeFlow(id);
        localStorage.setItem("progression", "dashboard");
    } else{
        // if(localStorage.getItem("topTracks") && localStorage.getItem("topTracks") !== "undefined"){
        //     retrieveData();
        // } else{
        //     initialFetch(id);
        // }
        initialFetch(id);
    }

    async function initialFetch(id: string){
        console.log(`FETCH ACCESS TOKEN`);
        const accessToken = await getAccessToken(id, code);

        const profile = await fetchProfile(accessToken);
        const topTracks = await fetchTopTracks(accessToken);
        const topArtists = await fetchTopArtists(accessToken);

        localStorage.setItem("topTracks", JSON.stringify(topTracks.items));
        localStorage.setItem("topArtists", JSON.stringify(topArtists.items));
        localStorage.setItem("profile", JSON.stringify(profile));

        displayUser(JSON.parse(localStorage.getItem("profile")));
        populateTracks(JSON.parse(localStorage.getItem("topTracks")), TRACK_PAGINATION_INDEX);
        populateArtists(JSON.parse(localStorage.getItem("topArtists")), ARTIST_PAGINATION_INDEX);
        loadGraphs();
    }

    // function retrieveData(){
    //     console.log("RETRIEVE DATA");
    //     displayUser(JSON.parse(localStorage.getItem("profile")));
    //     populateTracks(JSON.parse(localStorage.getItem("topTracks")), TRACK_PAGINATION_INDEX);
    //     populateArtists(JSON.parse(localStorage.getItem("topArtists")), ARTIST_PAGINATION_INDEX);
    //     loadGraphs();
    // }
}

function displayUser(data: any){
    document.title = `Spotify Wrap | ${data.display_name}`;
}

export async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "https://spotify-wrap.vercel.app/callback");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://spotify-wrap.vercel.app/callback");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchTopTracks(token: string): Promise<any>{
    
    const result = await fetch(`https://api.spotify.com/v1/me/top/${CATEGORY.TRACKS}?time_range=${TIME_FRAME.MEDIUM}&limit=${LIMIT.MAX}&offset=0`, {
        method: "GET", headers: {Authorization: `Bearer ${token}`}
    });

    return await result.json();
}

async function fetchTopArtists(token: string): Promise<any>{
    const result = await fetch(`https://api.spotify.com/v1/me/top/${CATEGORY.ARTISTS}?limit=${LIMIT.MAX}&offset=0&time_range=${TIME_FRAME.MEDIUM}`, {
        method: "GET", headers: {Authorization: `Bearer ${token}`}
    });

    return await result.json();
}

const trackPaginationBtn: any = document.querySelectorAll(".dashboard__tracks-pagination button");
const trackPaginationCurrPage: any = document.getElementById("dashboard__tracks-pagination-currPage");


trackPaginationBtn.forEach((btn: HTMLButtonElement) => {
    btn.addEventListener("click", (btn: any) => {
        switch(btn.target.id){
            case "dashboard__tracks-pagination-btn-prev":
                trackPaginationHandler(JSON.parse(localStorage.getItem("topTracks")), "prev");
                break;
            case "dashboard__tracks-pagination-btn-next":
                trackPaginationHandler(JSON.parse(localStorage.getItem("topTracks")), "next");
                break;
        }
    });
});

function trackPaginationHandler(tracks: Array<object>, indicator: string){
    if(indicator === "prev" && TRACK_PAGINATION_INDEX !== 0){
        populateTracks(tracks, TRACK_PAGINATION_INDEX - 10);
        TRACK_PAGINATION_INDEX -= 10;
    } else if(indicator === "next" && TRACK_PAGINATION_INDEX !== 40){
        populateTracks(tracks, TRACK_PAGINATION_INDEX + 10);
        TRACK_PAGINATION_INDEX += 10;
    }
    trackPaginationCurrPage.innerText = `${(TRACK_PAGINATION_INDEX + 10) / 10}`;
}

function artistPaginationHandler(tracks: Array<object>, indicator: string){
    if(indicator === "prev" && ARTIST_PAGINATION_INDEX !== 0){
        populateArtists(tracks, ARTIST_PAGINATION_INDEX - 10);
        ARTIST_PAGINATION_INDEX -= 10;
    } else if(indicator === "next" && ARTIST_PAGINATION_INDEX !== 40){
        populateArtists(tracks, ARTIST_PAGINATION_INDEX + 10);
        ARTIST_PAGINATION_INDEX += 10;
    }
    artistPaginationCurrPage.innerText = `${(ARTIST_PAGINATION_INDEX + 10) / 10}`;
}


function populateTracks(tracks: Array<any>, paginationIndex: number){
    let tracks_list = <HTMLUListElement> document.getElementById("dashboard__tracks-list");
    let children = tracks_list.children;

    readTracks(Array.from(children), paginationIndex);

    function readTracks(array: Array<any>, startingIndex: number){
        let placeholder: number = 0;
        for(let currIndex = startingIndex; currIndex < startingIndex + 10; currIndex++){
            if(tracks[currIndex].artists.length === 1){
                array[placeholder].firstChild.innerText = `${currIndex + 1}. ${tracks[currIndex].name} - ${tracks[currIndex].artists[0].name}`;
            } else{
                array[placeholder].firstChild.innerText = `${currIndex + 1}. ${tracks[currIndex].name} - ${readArtists(tracks[currIndex].artists)}`;
            }
            placeholder++;
        }
    }

    function readArtists(array: Array<any>){
        let names: string = "";

        if(array.length === 2){
            names = `${array[0].name} & ${array[1].name}`;
            return names;
        } else{
            array.forEach((artist: any) => {
                names += ` ${artist.name},`;
            });
    
            return names.trim();
        }
    }
}

function populateArtists(tracks: Array<any>, paginationIndex: number){
    let tracks_list = <HTMLUListElement> document.getElementById("dashboard__artists-list");
    let children = tracks_list.children;

    readArtists(Array.from(children), paginationIndex);

    function readArtists(array: Array<any>, startingIndex: number){
        let placeholder: number = 0;
        for(let currIndex = startingIndex; currIndex < startingIndex + 10; currIndex++){
            if(tracks[currIndex] !== undefined){
                array[placeholder].firstChild.innerText = `${currIndex + 1}. ${tracks[currIndex].name}`;
            } else{
                array[placeholder].firstChild.innerText = `${currIndex + 1}. `;
            }
            
            placeholder++;
        }
    }
}

const artistPaginationBtn: any = document.querySelectorAll(".dashboard__artists-pagination button");
const artistPaginationCurrPage: any = document.getElementById("dashboard__artists-pagination-currPage");

artistPaginationBtn.forEach((btn: HTMLButtonElement) => {
    btn.addEventListener("click", (btn: any) => {
        switch(btn.target.id){
            case "dashboard__artists-pagination-btn-prev":
                artistPaginationHandler(JSON.parse(localStorage.getItem("topArtists")), "prev");
                break;
            case "dashboard__artists-pagination-btn-next":
                artistPaginationHandler(JSON.parse(localStorage.getItem("topArtists")), "next");
                break;
        }
    });
});

export function gatherGenres(array: Array<any>){
    let genre_container: Array<object> = [];
    let placeholder_array: Array<any> = [];

    array.forEach((elem: any) => {
        elem.genres.forEach((genre: string) => {
            placeholder_array.push(genre);
        });
    });

    let breaking_point: boolean = false;

    while(!breaking_point){
        let temp: any = placeholder_array.filter((genre: string) => genre !== placeholder_array[0]);
        genre_container.push({genre: placeholder_array[0], count: placeholder_array.length - temp.length});
        placeholder_array = temp;

        if(placeholder_array.length === 0){
            breaking_point = true;
        }
    }

    return genre_container.sort((a: any, b: any) => {return b.count - a.count});
}

function loadGraphs(){
    const genres_holder: any = gatherGenres(JSON.parse(localStorage.getItem("topArtists")));
    var labels_array: Array<string> = [], occurrence_array: Array<number> = [];

    for(let currIndex = 0; currIndex < 10; currIndex++){
        labels_array.push(genres_holder[currIndex].genre);
        occurrence_array.push(genres_holder[currIndex].count);
    }

    const ctx = document.getElementById('myChart') as HTMLCanvasElement;

    const data = {
        labels: labels_array,
        datasets: [{
            label: 'Occurrence(s)',
            data: occurrence_array,
            hoverOffset: 4
        }]
    };

    const chart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top"
                },
                title: {
                    display: true,
                    text: "Most Listened to Genres"
                }
            }
        }
    });

    console.log(chart);
}