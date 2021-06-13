//Function to do fetch
function fetchJson(url) {
    return fetch(url).then((response) => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    });
}

//Função para formatar números.
Number.prototype.format = function () {
    return this.toString().split(/(?=(?:\d{3})+(?:\.|$))/g).join(".");
};

//HTML Elements
const confirmed = document.getElementById("confirmed");
const death = document.getElementById("death");
const recovered = document.getElementById("recovered");
const dataDeAtualizacao = document.getElementById("att");

//Date
var format = dateFns.format
let today = format(new Date(), "DD.MM.YYYY - HH:mm");

//Variables 
let summary = [];
let countries = [];

//Função para gerar gráfico de pizza
const pizza = () => {
    let newConfirmed = summary.Global.NewConfirmed;
    let newDeaths = summary.Global.NewDeaths;
    let newRecovered = summary.Global.NewRecovered;

    let pizza = new Chart(document.getElementById("pizza"), {
        type: 'pie',
        data: {
            labels: ['Confirmados', "Mortes", "Rcuperados"],
            datasets: [
                {
                    data: [newConfirmed, newDeaths, newRecovered],
                    backgroundColor: ["#3e95cd", "#3c8523", "#42f39f"]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    postion: top,

                },
                title: {
                    display: true,
                    text: "Distribuição de celulares"
                }
            }
        }
    })

}

//Função para gerar gráfico de barras
const barras = () => {

    let countriesDeathsSorted = _.orderBy(
        summary.Countries,
        ["TotalDeaths", "Country"],
        ["desc", "asc"]
      );
      
      let countriesDeathsFiltered = _.slice(countriesDeathsSorted, 0, 10);

      let countriesMapped = _.map(countriesDeathsFiltered, "Country");
      let totalDeathsMapped = _.map(countriesDeathsFiltered, "TotalDeaths");
    
      let bar = new Chart(document.getElementById("barras"), {
        type: "bar",
        data: {
          labels: countriesMapped,
          datasets: [
            {
              label: "Total de Mortes",
              data: totalDeathsMapped,
              backgroundColor: "rgba(153, 102, 255)",
            },
          ],
        },
        options: {
          reponsive: true,
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: "Top 10 número de mortes por país",
              font: {
                size: 20,
              },
            },
          },
        },
      });
}

//Função pra dados 
const totalData = () => {
    let attDate = format(summary.Global.Date.split("T")[0], "DD.MM.YYYY");
    let attHour = summary.Global.Date.substring(11, 16);

    const attArray = [attDate, attHour];
    const att = attArray.join(" - ");

    confirmed.innerText = summary.Global.TotalConfirmed.format();
    death.innerText = summary.Global.TotalDeaths.format();
    recovered.innerText = summary.Global.TotalRecovered.format();
    dataDeAtualizacao.innerText = att;
    console.log(countries);
}

//Function to get summary & countries data
async function getData() {
    try {
        [summary, countries] = await Promise.all([
            fetchJson("https://api.covid19api.com/summary"),
            fetchJson("https://api.covid19api.com/countries"),
        ]);
        console.log(summary);
        totalData();
        pizza();
        barras();
    } catch (error) {
        console.log(error);
    }
}

getData();