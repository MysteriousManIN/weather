"use strict";

$(()=>{

    const API_KEY = "3d41c81e06e54f5c86924343222708", BASE_URL = "https://api.weatherapi.com/v1/";
    const _fetch = async (url) => { return await (await fetch(url)).json(); };

    const AQI = {
        usEpaIndex: (val) => {
            switch(val){
                case 1: return "Good";
                case 2: return "Moderate";
                case 3: return "Unhealthy for sensitive groups";
                case 4: return "Unhealthy";
                case 5: return "Very unhealthy";
                case 6: return "Hazardous";
            }
        }
    };

    const weatherAPIs = {
        search: (q) =>{ return _fetch(BASE_URL + `search.json?key=${API_KEY}&q=${q}`); },
        forecast : (location, date) => { return _fetch(BASE_URL + `forecast.json?key=${API_KEY}&aqi=yes&q=${location}&dt=${date}`); }
    };

    const dateList = (nod = 1) => {

        const date = new Date();
        let i, list = [];

        for(i = 0 ; i < nod ; i++){
            let [ m, d, y ] = date.toLocaleDateString().split("/");
            list.push(`${y}-${m}-${d}`);
            date.setDate(date.getDate() + 1);
        }

        return list;

    };

    const removePreloader = () => {

        $("#preloader").remove();

    };

    let weather_data = { location:null, current:null, forecastDays: [] };

    function displayCurrentWeather(){

        const { location, current } = weather_data;
        let { country, name, region } = location,
            { temp_c, feelslike_c, last_updated, humidity, precip_mm, uv, wind_degree, wind_kph, cloud, vis_km } = current,
            { icon, text } = current.condition;

        last_updated = new Date(last_updated);
        let [ dayname, monthname, date ] = last_updated.toDateString().split(" "),
            [ time, am_pm ] = last_updated.toLocaleTimeString().split(" "),
            [ hours, minutes ] = time.split(":");

        icon = icon.replace("64x64", "128x128");

        let cw_details = {
            "Humidity": humidity + " %",
            "Precip": precip_mm + " mm",
            "Wind speed": wind_kph + " kph",
            "Wind degree": wind_degree + "<sup>&deg;</sup>",
            "UV": uv,
            "Cloud": cloud + " %",
            "Vision": vis_km + " km" 
        };

        $("#location > h1").text(name);
        $("#location > span").text(`${region}, ${country}`);
        $("#cw-img").css({ "background-image": `url("https:${icon}")` });
        $("#cw-temp").text(Math.round(temp_c));
        $("#cw-name").text(text);
        $("#cw-feelslike").text(Math.round(feelslike_c));
        $("#cw-dt").text(`Today, ${hours}:${minutes} ${am_pm}`);

        $("#cw-details").html("");
        Object.keys(cw_details).forEach(key=>{
            $("#cw-details").append(`<div><span>${cw_details[key]}</span><span>${key}</span></div>`)
        });

    }

    function displayForecast(dnum){

        const { astro, day, hour } = weather_data.forecastDays[dnum];
        let { sunrise, sunset, moonrise, moonset } = astro;

        const displayHourly = (h) => {

            let { temp_c, humidity, precip_mm, wind_kph, wind_degree, uv, cloud, vis_km, feelslike_c, chance_of_rain, chance_of_snow, condition, time:datetime  } = hour[h],
                { icon, text } = condition;

            datetime = new Date(datetime);
            let [ dayname, monthname, date ] = datetime.toDateString().split(" "),
                [ time, am_pm ] = datetime.toLocaleTimeString().split(" "),
                [ hours, minutes ] = time.split(":");

            icon = icon.replace("64x64", "128x128");

            let hf_details = {
                "Humidity": humidity + " %",
                "Precip": precip_mm + " mm",
                "Wind speed": wind_kph + " kph",
                "Wind degree": wind_degree + "<sup>&deg;</sup>",
                "UV": uv,
                "Cloud": cloud + " %",
                "Vision": vis_km + " km" 
            };

            let hf_details_1 = {
                "Sunrise": sunrise,
                "Sunset": sunset,
                "Moonrise": moonrise,
                "Moonset": moonset,
                "Rain chance": chance_of_rain + " %",
                "Snow chance": chance_of_snow + " %",
            };

            $("#hf-dt").text(`At ${dayname} ${date} ${monthname}, ${hours}:${minutes} ${am_pm}`);
            $("#hf-img").css({ "background-image": `url("https:${icon}")` });
            $("#hf-temp").text(Math.round(temp_c));
            $("#hf-name").text(text);
            $("#hf-feelslike").text(Math.round(feelslike_c));

            $("#hf-details").html("");
            Object.keys(hf_details).forEach(key=>{
                $("#hf-details").append(`<div><span>${hf_details[key]}</span><span>${key}</span></div>`)
            });

            $("#hf-details-1").html("<div><div>");
            Object.keys(hf_details_1).forEach(key=>{
                $("#hf-details-1").append(`<div><span>${hf_details_1[key]}</span><span>${key}</span></div>`)
            });

        };

        const forHfRange = ()=>{
            let val = parseInt($("#hf-range").val()), fill = (val*100)/23;
            $("#hf-range").css({ "background-image": `linear-gradient(to right, var(--c_0_3) ${fill}%, var(--c_t) 0%)` });
            displayHourly(val);
        }

        $("#hf-range").on({ "input": forHfRange, "change": forHfRange });

        $("#hf-range").val((new Date(weather_data.current.last_updated)).getHours());
        forHfRange();

    }

    function displayDayCards(){

        $("#day-cards").html("");
        weather_data.forecastDays.forEach((f, i)=>{

            let { date, day } = f,
                { mintemp_c, maxtemp_c, condition  } = day,
                { icon } = condition,
                [ , m, d ] =  (new Date(date)).toDateString().split(" ");

            let card = $("<div>").append(
                $("<span>").text(`${d} ${m}`),
                $("<div>").css({ "background-image": `url('${icon}')` }),
                $("<span>").text(`${Math.round(mintemp_c)}/${Math.round(maxtemp_c)}`)
            );

            card.on("click", ()=>{
                $("#day-cards > div.active").removeClass("active");
                card.addClass("active");
                displayForecast(i);
            });

            $("#day-cards").append(card);

        });

    }

    async function displayWeather(location){

        for(let date of dateList(14)){

            let res = await weatherAPIs.forecast(location, date);
            if(res){

                if(!weather_data.location) weather_data.location = res.location;
                if(!weather_data.current) weather_data.current = res.current;

                weather_data.forecastDays.push(res.forecast.forecastday[0]);

            }
            
        }

        displayCurrentWeather();
        displayForecast(0);
        displayDayCards();

        removePreloader();

    }

    for(let i = 0 ; i <= 23 ; i++){
        let p = i;
        if(i%4 === 0){
            if(p === 0) p = 12;
            else if(p > 12) p -= 12;
        }else{ p = ""; }
        $("#hf-range-scale").append($("<span>",{ point:p }));
    }

    window.navigator.geolocation.getCurrentPosition(({ coords })=>{

        let { latitude:lat, longitude:long } = coords;

        displayWeather(`${lat},${long}`);

    });

});