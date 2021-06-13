const data_type = {
  Deaths: "Mortes",
  Recovered: "Recuperados",
  Confirmed: "Confirmados",
};

let linesChart;

(function startPage() {
  let dateStart = document.getElementById("date_start");
  let dateEnd = document.getElementById("date_end");

  dateStart.value = new Date(2021, 04, 01).toISOString().substr(0, 10);
  dateStart.max = new Date(2021, 04, 01).toJSON().split("T")[0];

  dateEnd.value = new Date().toISOString().substr(0, 10);
  dateEnd.max = new Date().toJSON().split("T")[0];

  //Pega botão que aplica filtros
  document.getElementById("filtro").addEventListener("click", handlerFilter);

  (async () => {
    let response = await Promise.allSettled([
      axios.get("https://api.covid19api.com/countries"),
      //Pega os dados do dia presente (Brasil foi colocado como valor default, e foi colocada uma data qualquer como default)
      axios.get(`https://api.covid19api.com/country/Brazil?from=${new Date(
          2021,
          04,
          01,
          -3,
          0,
          0
        ).toISOString()}&to=${new Date(2021, 04, 25, -3, 0, 0).toISOString()}`
      ),
      //Pega os dados do dia anterior (Brasil foi colocado como valor default, e foi colocada uma data qualquer como default)
      axios.get(`https://api.covid19api.com/country/Brazil?from=${new Date(
          2021,
          03,
          30,
          -3,
          0,
          0
        ).toISOString()}&to=${new Date(2021, 04, 24, -3, 0, 0).toISOString()}`
      ),
    ]);

    //Caso a promise tenha sido retornada, chama os dados (Country) da API e ordena de forma ascendente usando o método ._orderBy do lodash
    if (response[0].status === "fulfilled") {
      let json = _.orderBy(response[0].value.data, ["Country"], ["asc"]);
      loadCountries(json);
    }

    //prettier-ignore
    if (response[1].status === "fulfilled" && response[2].status === "fulfilled") {
      loadLineChart(response[1].value.data, response[2].value.data, "Deaths");
      loadKPI(response[1].value.data);
    }
  })();
})();

//Função para adicionar os países aos options do select
function loadCountries(json) {
  //Aqui eu toô pegando o select
  let combo = document.getElementById("cmbCountry");

  //Aqui passo pelos países dos dados da API
  for (index in json) {
    //Esse new Option é do próprio javascript, ele precisa receber um valor texto, um outro valor tipo um Id, um valor para aparecer como option padrão, e um valor para o option padrão selecionado
    combo.options[combo.options.length] = new Option(
      //Valor de texto vão ser os countries
      json[index].Country,
      //Id dos country selecionado
      json[index].Country,
      //Valor padrão selecionado
      json[index].Country === "Brazil",
      //Valor padrão selecionado que vai aparecer no select
      json[index].Country === "Brazil"
    );
  }
}

//Função para preencher/criar um gráfico de linhas, tem três parâmetros: os dados da data, os dados do dia anterior a data escolhida e o tipo de dado que quer exibir (óbitos, casos confimados ou recuperados)
function loadLineChart(json, jsonDelta, dataType) {

  //Carrega as informações de data que vai ser o eixo X do gráfico de linhas
  let dates = _.map(json, "Date");
  let values = _.map(json, dataType);
  let deltaValues = _.map(jsonDelta, dataType);

  values = _.each(values, (x, index) => {
    values[index] = values[index] - deltaValues[index];
  });

  //Essé o valor da linha de Média de mortes no gráfico
  let avg = _.times(values.length, _.constant(_.mean(values)));

  //Gráfico de linhas disponibilizado pela biblioteca chart.js
  linesChart = new Chart(document.getElementById("linhas"), {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        //Linha do número de mortes
        {
          data: values,
          label: `Número de ${data_type[dataType]}`,
          borderColor: "rgb(255,140,13)",
        },
        //Linha da média de mortes
        {
          data: avg,
          label: `Média de ${data_type[dataType]}`,
          borderColor: "rgb(255,0,0)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top", //top, bottom, left, rigth
        },
        title: {
          display: true,
          text: "Curva diária de Covid-19",
          font: {
            size: 20,
          },
        },
        layout: {
          padding: {
            left: 100,
            right: 100,
            top: 50,
            bottom: 10,
          },
        },
      },
    },
  });
}

//Pega os elementos "Total de confirmados", "Total de mortes" e "Total de recuperados" da página e popula com as informações de um país
function loadKPI(json) {
  //O _.last vem da biblioteca lodash.js e pega o último elemento
  document.getElementById("kpiconfirmed").innerText =_.last(json).Confirmed.toLocaleString("PT");
  document.getElementById("kpideaths").innerText = _.last(json).Deaths.toLocaleString("PT");
  document.getElementById("kpirecovered").innerText =_.last(json).Recovered.toLocaleString("PT");
}

//Função para capturar evento de click no botão de filtro
async function handlerFilter() {
  let dataCountry = document.getElementById("cmbCountry");

  //Pega o elemento data de início da página
  let startDate = new Date(document.getElementById("date_start").value);

  //Pega o elemento data fim da página
  let endDate = new Date(document.getElementById("date_end").value);

  endDate = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
    -3,
    0,
    1,
    0
  );

  
  startDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate() + 1,
    -3,
    0,
    0,
    0
  );

  //Data de início, o -3 é a questão do fuso horário, usamos ele para deixar no nosso fuso
  let startDateDelta = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    -3,
    0,
    0
  );

  //Data de fim, o -3 é a questão do fuso horário, usamos ele para deixar no nosso fuso
  let endDateDelta = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
    -3,
    0,
    0,
    1
  );

  //prettier-ignore
  //Pegando as rotas que serão consumidas
  let response = await Promise.allSettled([
    axios.get(`https://api.covid19api.com/country/${dataCountry.value}?from=${startDate.toISOString()}&to=${endDate.toISOString()}`),
    axios.get(`https://api.covid19api.com/country/${dataCountry.value}?from=${startDateDelta.toISOString()}&to=${endDateDelta.toISOString()}`),
  ]);

  //Certificando que a promise foi 'cumprida' 
  if (response[0].status === "fulfilled" && response[1].status === "fulfilled") {
    //O destroy é usado pois o gráfico buga quando já está em uso e mudamos os valores que ele usa, então precisamos destruiur o que já existe e criar um novo com os novos dados
    linesChart.destroy();
    //Chamando os dados da função loadKPI
    loadKPI(response[0].value.data);
    //Chamando os dados da função LoadLineChart
    loadLineChart(
      response[0].value.data,
      response[1].value.data,
      document.getElementById("cmbData").value
    );
  }
}
