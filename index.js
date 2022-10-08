"use strict";

$(()=>{

    let weather_data;

    const API_KEY = "3d41c81e06e54f5c86924343222708", BASE_URL = "https://api.weatherapi.com/v1/";
    const _fetch = async (url) => { return await (await fetch(url)).json(); };

    const weatherAPIs = {
        search: (q) =>{ return _fetch(BASE_URL + `search.json?key=${API_KEY}&q=${q}`); },
        forecast : (location, date) => { return _fetch(BASE_URL + `forecast.json?key=${API_KEY}&aqi=yes&q=${location}&dt=${date}`); }
    };

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

    const simplifyDateTime = (dt) => { // dt = YYYY-MM-DD HH:MM:SS

        dt = new Date(dt);
    
        let [ ds, ms, d, y, t ] = dt.toString().split(" "), [ h, m ] = t.split(":"),
        res = {
            date: d,
            year: y,
            hours: h > 12 ? "0" + (h - 12) : h,
            minutes: m,
            day_shortname: ds,
            month_shortname: ms,
            am_pm: h >= 12 ? "PM" : "AM"
        };
        
        return res;
    
    };

    const dateList = (nod = 1) => {

        const date = new Date();
        let i, list = [];

        for(i = 0 ; i < nod ; i++){
            let [ m, d, y ] = [ date.getMonth() + 1, date.getDate(), date.getFullYear() ];
            list.push(`${y}-${m}-${d}`);
            date.setDate(date.getDate() + 1);
        }

        return list;

    };

    const removePreloader = () => {

        $("#preloader").remove();

    };

    const displayCurrentWeather = () => {

        const { location, current } = weather_data;
        let { country, name, region } = location,
            { temp_c, feelslike_c, last_updated, humidity, precip_mm, uv, wind_degree, wind_kph, cloud, vis_km } = current,
            { icon, text } = current.condition,
            { hours, minutes, am_pm  } = simplifyDateTime(last_updated);

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

    const displayForecast = (dnum) => {

        const { astro, day, hour } = weather_data.forecastDays[dnum];
        let { sunrise, sunset, moonrise, moonset } = astro;

        const displayHourly = (h) => {

            let { temp_c, humidity, precip_mm, wind_kph, wind_degree, uv, cloud, vis_km, feelslike_c, chance_of_rain, chance_of_snow, condition, time } = hour[h],
                { icon, text } = condition,
                { day_shortname, month_shortname, date, hours, minutes, am_pm  } = simplifyDateTime(time);

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

            $("#hf-dt").text(`At ${day_shortname} ${date} ${month_shortname}, ${hours}:${minutes} ${am_pm}`);
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

    const displayDayCards = () => {

        $("#day-cards").html("");
        weather_data.forecastDays.forEach((f, i)=>{

            let { date, day } = f,
                { mintemp_c, maxtemp_c, condition  } = day,
                { icon } = condition,
                { month_shortname:m, date:d } =  simplifyDateTime(date);

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

    const displayWeather = async (location) => {

        weather_data = { location:null, current:null, forecastDays: [] };

        for(let date of dateList(7)){

            let res = await weatherAPIs.forecast(location, date);
            if(res){

                if(!weather_data.location) weather_data.location = res.location;
                if(!weather_data.current) weather_data.current = res.current;

                weather_data.forecastDays.push(res.forecast.forecastday[0]);

            }
            
        }

        console.log(weather_data);

        displayCurrentWeather();
        displayForecast(0);
        displayDayCards();

        $("#fetching").removeClass("active");
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

    $("#search-bar > button").on("click", ()=>{

        $("#search-bar").toggleClass("active");
        $("main").toggleClass("show-search-bar");

        if($("#search-bar").hasClass("active")){
            $("#search-bar > input").focus();
            $("#search-bar > button").text("close");
        }else{
            $("#search-result").html("");
            $("#search-bar > input").val("");
            $("#search-bar > button").text("search-2");
        }

    });

    let searching;
    $("#search-bar > input").on("input", ()=>{

        if(searching) window.clearTimeout(searching);

        searching = window.setTimeout(async ()=>{
            
            let val = $("#search-bar > input").val().trim();
            if(val.length > 2){

                let res = await weatherAPIs.search(val);

                $("#search-result").html("");
                res.forEach(v=>{

                    let { name, region, country, url } = v;
                    let div = $("<div>", { class:"truncate_string" }).text([name, region, country].join(", "));

                    div.on("click", ()=>{

                        $("#fetching").addClass("active");
                        $("#search-bar > button").click();
                        displayWeather(url);

                    });

                    $("#search-result").append(div);

                });

            }else{
                $("#search-result").html("");
            }

        }, 500);

    });

    displayWeather("Mathura");

});
