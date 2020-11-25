import { Component } from "@angular/core";
import { Storage } from "@ionic/storage";

import { Map, tileLayer, marker, circle, divIcon } from "leaflet";
import { Geolocation, Geoposition } from "@ionic-native/geolocation/ngx";

@Component({
    selector: "app-home",
    templateUrl: "home.page.html",
    styleUrls: ["home.page.scss"]
})
export class HomePage {
    map: Map;
    myMarker: any;
    myCircle: any;
    myOrigin: any;
    lat = 45.702163;
    long = 5.764711;
    currentLat = 0; //45.702163;
    currentLong = 0; // 5.764711;
    public circleDistance = 20;
    showParam = false;
    public originIsSetting = false;

    constructor(private storage: Storage, private geolocation: Geolocation) {
        const run = () => {
            this.geolocation
                .getCurrentPosition()
                .then(resp => {
                    if ("coords" in resp) {
                        this.currentLat = resp.coords.latitude;
                        this.currentLong = resp.coords.longitude;
                        if ([null, undefined].indexOf(this.map) === -1) {
                            this.refreshMarker();
                        }
                    }
                })
                .catch(error => {
                    console.log("Error getting location", error);
                });

            let watch = this.geolocation.watchPosition();
            watch.subscribe(data => {
                if ("coords" in data) {
                    this.currentLat = data.coords.latitude;
                    this.currentLong = data.coords.longitude;
                    if ([null, undefined].indexOf(this.map) === -1) {
                        this.refreshMarker();
                    }
                }
            });
        };

        this.getSavedOrigin().then(() => {
            this.getSavedCircle().then(run);
        });
    }

    getSavedOrigin() {
        return new Promise((resolve, reject) => {
            this.getStorage("origin")
                .then((savedVal: any) => {
                    try {
                        let val = JSON.parse(savedVal);
                        if ("lat" in val) {
                            try {
                                this.lat = parseFloat(val["lat"]);
                                this.long = parseFloat(val["long"]);
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                    resolve();
                })
                .catch(resolve);
        });
    }

    getSavedCircle() {
        return new Promise((resolve, reject) => {
            this.getStorage("circle")
                .then((circle: any) => {
                    try {
                        this.circleDistance = parseFloat(circle);
                    } catch (e) {
                        console.log(e);
                    }

                    resolve();
                })
                .catch(resolve);
        });
    }

    getStorage(name) {
        return new Promise((resolve, reject) => {
            this.storage.get(name).then(givenValue => {
                if ([null, undefined].indexOf(givenValue) !== -1) {
                    return reject();
                }

                resolve(givenValue);
            });
        });
    }

    ionViewDidEnter() {
        let lat = 45.702163;
        let long = 5.764711;
        let zoomlevel = 13;
        this.map = new Map("map").setView([lat, long], zoomlevel);
        tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                'Map data <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        }).addTo(this.map);

        this.refreshMarker();
        this.refreshOrigin();

        this.refreshCircle();

        this.map.on("click", <LeafletMouseEvent>(e) => {
            if (this.originIsSetting === true) {
                this.lat = e.latlng.lat;
                this.long = e.latlng.lng;
                this.storage.set(
                    "origin",
                    JSON.stringify({ lat: this.lat, long: this.long })
                );
                this.originIsSetting = false;
                this.refreshOrigin();
                this.refreshCircle();
            }
        });
    }

    createIcon(color) {
        const markerHtmlStyles = `
  background-color: ${color};
  width: 30px;
  height: 30px;
  display: block;
  left: -15px;
  top: -15px;
  position: relative;
  border-radius: 50% 50% 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`;

        return divIcon({
            className: "my-custom-pin",
            iconAnchor: [0, 24],
            popupAnchor: [0, -36],
            html: `<span style="${markerHtmlStyles}" />`
        });
    }

    refreshMarker() {
        if ([null, undefined].indexOf(this.myMarker) === -1) {
            this.map.removeLayer(this.myMarker);
        }

        this.myMarker = marker([this.currentLat, this.currentLong], {
            icon: this.createIcon("#b707b1"),
            draggable: false
        }).addTo(this.map);
    }
    refreshOrigin() {
        if ([null, undefined].indexOf(this.myOrigin) === -1) {
            this.map.removeLayer(this.myOrigin);
        }

        this.myOrigin = marker([this.lat, this.long], {
            draggable: false,
            icon: this.createIcon("blue")
        }).addTo(this.map);
    }

    refreshCircle() {
        if ([null, undefined].indexOf(this.myCircle) === -1) {
            this.map.removeLayer(this.myCircle);
        }

        this.myCircle = circle(
            [this.lat, this.long],
            this.circleDistance * 1000
        ).addTo(this.map);
    }

    public toggleParam() {
        this.showParam = !this.showParam;
    }

    public changeCircle(e, isInput = false) {
        this.circleDistance = isInput === false ? e.detail.value : e.target.value;
        this.storage.set("circle", this.circleDistance);
        this.refreshCircle();
    }

    public setOrigin(currentPlace = false) {
        this.showParam = false;
        if (currentPlace === false) {
            return (this.originIsSetting = true);
        }

        this.lat = this.currentLat;
        this.long = this.currentLong;

        this.storage.set(
            "origin",
            JSON.stringify({ lat: this.lat, long: this.long })
        );

        this.refreshOrigin();
        this.refreshCircle();
    }
}
