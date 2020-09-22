google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);


console.log("Hello World");
const bigButton = document.getElementById('bigButton');



let constData = new Array([0,0]);
let counter = 0;
const start = Date.now();
let millis = 0;




bigButton.addEventListener('click', function(event) {
    printStuff();
  });




  function printStuff()
  {
      console.log("Button pressed");
      navigator.bluetooth.requestDevice({
        filters: [{
          services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
        }]
      })
      .then(device => device.gatt.connect())
      //console.log("Connected");
      
      .then(server => {
        // Getting ECG Service...
        console.log("connected");
        return server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      })
      
      .then(service => {
        // Getting ECG Level Characteristic...
        console.log("Server");
        return service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
      })
      .then(characteristic => characteristic.startNotifications())
      .then(characteristic => {
        // Set up event listener for when characteristic value changes.
        characteristic.addEventListener('characteristicvaluechanged',
          handleCharacteristicValueChanged);
          console.log('Notifications have been started.');
        // Reading Battery Level...
        //return characteristic.readValue();
      })
      .then(device => {
        // Set up event listener for when device gets disconnected.
        device.addEventListener('gattserverdisconnected', onDisconnected);
      
        // Attempts to connect to remote GATT Server.
        return device.gatt.connect();
      })
      .then(server => { /* ... */ })
      .catch(error => { console.log(error); });
      
      
      function handleCharacteristicValueChanged(event) {
        let newData = event.target.value.getUint16(0, true);
        //let millis = Date.now() - start;
        //console.log((millis/1000) + "  " + newData);
        millis = millis + 5;
        constData.push([millis , newData]);
        counter++;
        

        if (constData.length >= 400)
        {
          constData.shift();
        }
        if (counter>100)
        {
          counter=0;
          drawChart();
        }
        
      }
      
  }

  function drawChart() {
    var data = new google.visualization.DataTable();
      data.addColumn('number', 'time');
      data.addColumn('number', 'signal');

      
      data.addRows(constData); 
      
    var options = {
      title: 'EKG',
      curveType: 'function',
      legend: { position: 'bottom' }
    };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
    chart.draw(data, options);
  }



