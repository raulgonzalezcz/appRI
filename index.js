//Variables of the application
    var obj = {};
    var docnum = 0;
    var df = 0;
    var foundWord = 0;
    var noQuery = -1;
    var specificQuery = "";
    var resPrecisionRecall = [];
    var resFMeasure = [];
    var docsInformation = [];
    var indexSnippet = 0;
//Variables for TF in a specific document
    var tf = 0 ;
    var file;
//Variables to poulate table Docs
    var title = "";
    var author = "";
    var biblio = "";
    var body = "";
//Get elements by its id's
    var optionWeight = "tfidf";
    var optionSimilarity = "dotproduct";
    var fileInput = document.getElementById('fileInput');
    var term = document.getElementById("term");
    var id = document.getElementById("id");
    var form = document.getElementById("form");
    var selectForm = document.getElementById("mySpecificQuery");
    var retrDocs = document.getElementById("retrDocs");

//Set the label of the columns when we export to CSV
    var nameOfCSVPR= "";
    var nameOfCSVF= "";
    resPrecisionRecall[0] = ['idDoc','noDoc','precision', 'recall'];
    resFMeasure[0] = ['idDoc','noDoc','precision', 'recall'];

//Function to populate the database
  function populateDB(){
    populateTableDocs();
    populateTableInvInd();
    populateTableTerms();
  }

//Function to clear the data after populate each row in table Docs
    function clearDataDocs(){
       title = "";
       author = "";
       biblio = "";
       body = "";
    }

//Function to connect with the server. We specify IP and port
var socket = io.connect("http://localhost:3000");
socket.on("connect", function () { //Connection was established
  console.log("Connected to server!");
});

//Function to clear the data after searching a term
    function clearData(){
      docnum = 0;
      df = 0;
      foundWord = 0;
      tf = 0 ;
    }

/*Function to populate the table Docs. We traverse the document cran.1400.txt, adding the content corresponding to each title, 
author, credits and abstract of a certain document through the established socket. 
*/
    function populateTableDocs(){
      var reader = new FileReader();
      reader.onload = function (e) {
          // Read the text by lines
          var lines = reader.result.split('\n');
          var numLines = lines.length;
          console.log("Number of lines: "+lines.length);
          console.log(lines[0].substring(0,2)); //.I, .T, .A, ...
            //New document to traverse
            contAux = 1;
            while(contAux<numLines){
              docnum++;
              while(lines[contAux].substring(0,2) !=".A"){
                title=title+lines[contAux].replace(/'/g , "´")+" ";
                contAux++;
              }
              while(lines[contAux].substring(0,2) !=".B"){
                author=author+lines[contAux].replace(/'/g , "´")+" ";
                contAux++;
              }
              while(lines[contAux].substring(0,2) !=".W"){
                biblio=biblio+lines[contAux].replace(/'/g , "´")+" ";
                contAux++;
              }
              while(lines[contAux].substring(0,2) !=".I" && (contAux+1) < numLines){
                body=body+lines[contAux].replace(/'/g , "´")+" ";
                contAux++;
              }
              contAux++;
                // console.log(title.substring(3,title.length));
                // console.log(author.substring(3,author.length));
                // console.log(biblio.substring(3,biblio.length));
                // console.log(body.substring(3,body.length));
                console.log("Fin doc "+docnum+", linea "+contAux);
                socket.emit('populateDocs', docnum, title.substring(3,title.length), author.substring(3,author.length), biblio.substring(3,biblio.length), body.substring(3,body.length));
              clearDataDocs();
            }
            //Clean the variables if we need to read another file (maybe in future implementations)
          clearData();
      }
      //Read the selected text file
      reader.readAsText(file);
    }

/*Function to populate the table invertedindex.  We traverse the document cran.1400.txt and for each line in the document, we split it
to get each term. Then the term is cleaned by removing semicolons, question marks, commas and other punctuation marks. Additionally
we get the corresponding term frequency adding it to a dictionary (the keys are the idDoc and term). Then we add it to database
through the established socket.
*/
    function populateTableInvInd(){
      var reader = new FileReader();
      reader.onload = function (e) {
          // Read the text by lines
          var lines = reader.result.split('\n');
          console.log("Number of lines: "+lines.length);
          for (var i = 0; i < lines.length; i++) {
            var replacedLine = lines[i].replace(/\,|\(|\)|\.|\/|\?/g , "").replace(/'/g , "´");
            var terms = replacedLine.split(' ');
              // Read each term in the line
              for (var j = 0; j < terms.length; j++) {
                  if(terms[j] == "I") { //New document found
                    docnum++;
                    if(docnum in obj == false){
                        obj[docnum] = {}; // must initialize the sub-object, otherwise will get 'undefined' errors
                    }
                  }
                  //Generate the dictionary where keys are (idDoc, term) and value is tf
                  if(docnum!=0 && terms[j]!="" && (terms[j] == terms[j].toLowerCase())) { 
                     if (terms[j] in obj[docnum]) {
                        obj[docnum][terms[j]] += 1;
                    } else {
                        obj[docnum][terms[j]] = 1;
                    }
                  }
              }
          }
          //Check the structure is ok
          console.log(obj);
          //Send the data to populate the table (idDoc, term, tf)
          for(var key in obj){ //idDoc
              for(var keyB in obj[key]){ //term
                //console.log(key+","+keyB+","+obj[key][keyB]); //Ckech ff
                socket.emit('populateInvInd', key, keyB, obj[key][keyB]);
              }
          }
          //Clean the variables if we need to read another file (maybe in future implementations)
          clearData();
      }
      //Read the selected text file
      reader.readAsText(file);
    }

//Function to notify the server to populate the table Terms according to number of files in Docs.
    function populateTableTerms(){
      socket.emit('populateTerms', 1400);
    }

//Function to clear the area where we show the result search to the user
  function clearAreaResultSearch(){
    retrDocs.innerHTML = "";
    docsInformation = [];
    indexSnippet = 0;
  }

//Function to get the specific schema to assign weights and calculate similarity
    function getRadioValue(){
      for (var i = 0; i < document.getElementsByName('weight').length; i++){
          if (document.getElementsByName('weight')[i].checked)
          {
              optionWeight = document.getElementsByName('weight')[i].value;
          }
      }
      for (var i = 0; i < document.getElementsByName('similarity').length; i++){
          if (document.getElementsByName('similarity')[i].checked)
          {
              optionSimilarity = document.getElementsByName('similarity')[i].value;
          }
      }
    }

/*Function to get the similarity according to documents. First we evaluate if the query is predifined beacuase it allows us to
get precision, recall and evaluate the efficiency of the program. Else we only can establish the similarity of the query according to
the documents in the collection. In both cases we get all the terms in te query and theirs term frequencies and then we send the data
to the server to populate the table Query. The result is obtained through the established socket
*/
    function getSimilarityDocs(){
      //We need to clean the table Query in order to evaluate new queries
        socket.emit('cleanSQuery', true);
        socket.emit('cleanWeight_docs', true);
        socket.emit('cleanWeight_q', true);
      var terms;
      //getRadioValue(); //NOTE: Use this function when we need to assign alternative schemas
      //Clear the area where we show the result search to the user
      clearAreaResultSearch();
      if(noQuery!=-1){ //It´s a pre-defined query
        terms = specificQuery.split(" ");
        nameOfCSVPR='Q'+noQuery.toString()+"-";
        nameOfCSVF='Q'+noQuery.toString()+"-";
      }else{ //The query was introduced by the user
        terms = term.value.split(" ");
      }
      var dict = {};
      //Generate the dictionary where key is term and value is tf
        for(var i=0;i<terms.length;i++){
          if (terms[i] in dict) {
            dict[terms[i]] += 1;
          } else {
            dict[terms[i]] = 1;
          }
        }
        //Check the structure is ok
        console.log(dict);
        //Send Term and tf to server to populate the table Query
        for (var key in dict){
          //Term and tf
          socket.emit('populateSQuery', key, dict[key]);
        }
        //Once we populate the table Query, we proceed to get the similarity of the documents according to the query
        if(optionWeight=="tfidf" && optionSimilarity=="dotproduct") {
          socket.emit('getTFIDFDot', true);
          nameOfCSVPR+="TFIDFDot-PR.csv";
          nameOfCSVF+="TFIDFDot-F.csv";
        }
        if(optionWeight=="tfidf" && optionSimilarity=="dice") {
          socket.emit('populateWeightDocs', optionWeight);
          socket.emit('populateWeightQuery', optionWeight);
          socket.emit('getTFIDFDice', true);
          nameOfCSVPR+="TFIDFDice-PR.csv";
          nameOfCSVF+="TFIDFDice-F.csv";
        }
        if(optionWeight=="log" && optionSimilarity=="dotproduct") {
          socket.emit('getLogDot', true);
          nameOfCSVPR+="LogDot-PR.csv";
          nameOfCSVF+="LogDot-F.csv";
        }
        if(optionWeight=="log" && optionSimilarity=="dice") {
          socket.emit('populateWeightDocs', optionWeight);
          socket.emit('populateWeightQuery', optionWeight);
          socket.emit('getLogDice', true);
          nameOfCSVPR+="LogDice-PR.csv";
          nameOfCSVF+="LogDice-F.csv";
        }
    }

//Function that allow us to know if there is a pre-defined query (noQuery must be distinct of "-1")
    function getSpecificQuery(){
      noQuery = selectForm.value; 
      specificQuery = selectForm.options[selectForm.selectedIndex].text;
      //alert(noQuery+","+specificQuery); //Check the selected query
    }

//Function to show the area result search
function showSnippet(){
  retrDocs.innerHTML = "";
  var stringRes = "";
  console.log(docsInformation);
  for(var i =0; i < 10; i++){
    var entry = document.createElement('li');
    entry.value = indexSnippet+i+1;
    stringRes = docsInformation[indexSnippet+i][0].title + "\n" + docsInformation[indexSnippet+i][0].abstract.substr(0, 150) + "...\n";
    entry.appendChild(document.createTextNode(stringRes));
    retrDocs.appendChild(entry);
  }
}

//Functions to diplar teh previous/next for the result search
function nextPage(){
  indexSnippet += 10;
  showSnippet();
}

function previousPage(){
  indexSnippet -= 10;
  showSnippet();
}

/*This function refers that the server send us the result of the similarity through the socket. So we need to traverse it and
get the idDoc and similarity. Then we send a responde to the server because we need to evaluate the efficiency if there was
a pre-defined query.
*/
    socket.on ('messageSuccess', function (result) {
      console.log("Similarity done:");
      //console.log(result); //Check the result is ok
      //var stringRes = "";
      var docsRetrieved = []; //Array that will contain the retrieved documents
        for(var i=0;i<result.length;i++){
            //stringRes = "Document " + result[i].idDoc + " with similarity of " + result[i].similarity + "\n";
            docsRetrieved.push(result[i].idDoc); //Add the retrieved documents
          }
        //alert("Los documentos obtenidos son: \n" + stringRes);
        //retrDocs.innerHTML += stringRes;
        socket.emit('getSnippetSearch', docsRetrieved);
        if(noQuery!=-1){ //Get precision, recall and f-measure of the program if there was a pre-defined document
          socket.emit('getPrecisionRecall', noQuery, docsRetrieved);
          socket.emit('getFMeasure', noQuery, docsRetrieved);
        }
    });


    socket.on ('sendInformationSnippet', function (result, totalDocs) {
      //console.log(result);
      docsInformation.push(result);
      //When we recieve all the information, we display it
      if(docsInformation.length == totalDocs) showSnippet();
    });

/*This function get the response of the server when we need to evaluate the efficiency of the program, so we add each result
(#doc, precision, recall).
*/
    socket.on ('messagePrecisionRecall', function (index, array) {
      //console.log(array);
      resPrecisionRecall[index] = array;
    });

    socket.on ('messageFMeasure', function (index, array) {
      //console.log(array);
      resFMeasure[index] = array;
    });

// And then we invoke the function to generate the csv.
    socket.on ('generateCSVPR', function (auth) {
      exportToCsvPR(nameOfCSVPR, resPrecisionRecall);
      //Reset the index for new queries
      resPrecisionRecall = [];
      resPrecisionRecall[0] = ['idDoc','noDoc','precision', 'recall'];
    });

    socket.on ('generateCSVF', function (auth) {
      exportToCsvF(nameOfCSVF, resFMeasure);
      //Reset the index for new queries
      resFMeasure = [];
      resFMeasure[0] = ['idDoc','noDoc','precision', 'recall'];
    });

/*This function generate the CSV to evaluate the program. We establish the number of rows and traverse each one to generate
each space in the file
*/
    function exportToCsvPR(filename, rows) {
      console.log("Number of relevant documents: "+ (rows.length-1)); //We exclude de title for columns
        var processRow = function (row) {
            var finalVal = '';
            //Traverse of each element in the line
            for (var j = 0; j < row.length; j++) {
              //Construct the corresponding string
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                //Clean the string
                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };

        //Traverse each element in array 
        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }

        //We set the character encoding and compatibility in browser
        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
          //The user get the csv as a file (a download is generated)
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        //Clear the file of the CSV
        nameOfCSVPR = "";
    }

    function exportToCsvF(filename, rows) {
      console.log("Number of relevant documents: "+ (rows.length-1)); //We exclude de title for columns
        var processRow = function (row) {
            var finalVal = '';
            //Traverse of each element in the line
            for (var j = 0; j < row.length; j++) {
              //Construct the corresponding string
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                //Clean the string
                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };

        //Traverse each element in array 
        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }

        //We set the character encoding and compatibility in browser
        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
          //The user get the csv as a file (a download is generated)
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        //Clear the file of the CSV
        nameOfCSVF = "";
    }