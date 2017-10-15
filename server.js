//Node modules to...
var io = require('socket.io').listen(3000); //Establish client-server communication
var mysql = require('mysql'); //Connection to database
var fs = require('fs'); //Read files

//Set properties to connect to database
var con = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "eff.006R",
  database: "sev0.1"
});

//Establish connection with data vase
io.sockets.on('connection', function (socket) {
    con.connect(function(err) {
	  if (err) throw err;
	  console.log("Connected client to database!");
	});

//The server recieves the petition from the user to populate the table Docs
	socket.on('populateDocs', function (docnum, title, author, credits, abstract) {
		console.log(docnum);
		console.log(title);
		console.log(author);
		console.log(credits);
		console.log(abstract);
		//SQL statement to insert values in table
    	var sql = "INSERT INTO docs VALUES ("+docnum+",'"+title+"','"+author+"','"+credits+"','"+abstract+"')";
		  con.query(sql, function (err, result) {
		    if (err) throw err;
		    //We notify the state of the operation
		    console.log("1 record inserted,  doc "+docnum+" inserted in Docs");
		  });
  	});

//The server recieves the petition from the user to populate the table invertedIndex
  	socket.on('populateInvInd', function (idDoc, term, tf) {
		// console.log(idDoc);
		// console.log(term);
		// console.log(tf);
		//SQL statement to insert values in table
    	var sql = "INSERT INTO invertedindex VALUES ("+idDoc+",'"+term+"',"+tf+")";
		  con.query(sql, function (err, result) {
		    if (err) throw err;
		    //We notify the state of the operation
		    console.log("1 record inserted,  doc "+idDoc+" with "+term+" inserted in InvertedIndex");
		  });
  	});

//The server recieves the petition from the user to populate the table Terms
  	socket.on('populateTerms', function (n) {
		// console.log(idDoc);
		// console.log(term);
		// console.log(tf);
		//SQL statement to insert values in table
    	var sql = "INSERT INTO terms SELECT term, log10((SELECT count(*) from Docs)/count(*)) FROM invertedindex GROUP BY term";
		  con.query(sql, function (err, result) {
		    if (err) throw err;
		    //We notify the state of the operation
		    console.log("Table Terms populated!");
		  });
  	});

//The server recieves the petition from the user to populate the table Query
  	socket.on('populateSQuery', function (term, tf) {
  		//SQL statement to insert values in table
    	var sql = "INSERT INTO squery VALUES ('"+ term +"', "+ tf +")";
		  con.query(sql, function (err, result) {
		    if (err) throw err;
		    //We notify the state of the operation
		    console.log(term+" inserted in Table SQuery");
		    console.log("---------------------------------");
		  });
  	});

 //The server recieves the petition from the user to populate the table Weight_Query
  	socket.on('populateWeightDocs', function (optionWeight) {
  		//SQL statement to insert values in table
  		var sql = "";
  		if(optionWeight=="tfidf") sql = "INSERT INTO weight_docs select idDoc, sum(i.tf * t.idf * i.tf * t.idf) from invertedindex i, terms t where i.term = t.term group by idDoc";
  		else sql = "INSERT INTO weight_docs select idDoc, sum((1 + log10(i.tf)) * t.idf * (1 + log10(i.tf)) * t.idf) from invertedindex i, terms t where i.term = t.term group by idDoc";
		  con.query(sql, function (err, result) {
		    if (err) throw err;
		    //We notify the state of the operation
		    console.log(" Table weight_docs completed");
		    console.log("---------------------------------");
		  });
  	});

 //The server recieves the petition from the user to populate the table Weight_Query
  	socket.on('populateWeightQuery', function (optionWeight) {
  		//SQL statement to insert values in table
  		var sql = "";
    	if(optionWeight=="tfidf") sql = "INSERT INTO weight_q select sum(q.tf * t.idf * q.tf * t.idf ) from squery q, terms t where q.term = t.term";
    	else sql = "INSERT INTO weight_q select sum((1 + log10(q.tf)) * t.idf * (1 + log10(q.tf)) * t.idf ) from squery q, terms t where q.term = t.term";
		  con.query(sql, function (err, result) {
		    if (err) throw err;
		    //We notify the state of the operation
		    console.log(" Table weight_q completed");
		    console.log("---------------------------------");
		  });
  	});

//The server recieves the petition from the user to get the similarity of documents according to the query
  	socket.on('getTFIDFDot', function (auth) {
  		if(auth){
  			//SQL statement to get the similarity (dot product)
  			var sql = "select i.idDoc, sum(q.tf * t.idf * i.tf * t.idf) as similarity from squery q, invertedindex i, terms t where q.term = t.term AND i.term = t.term group by i.IdDoc order by 2 desc";
			  con.query(sql, function (err, result) {
			    if (err) throw err;
			    console.log(result);
			    //We notify the state of the operation
			    io.sockets.emit ('messageSuccess', result);
			    console.log("---------------------------------");
			  });
  		}
  	});

 //The server recieves the petition from the user to get the similarity of documents according to the query
  	socket.on('getTFIDFDice', function (auth) {
  		if(auth){
  			//SQL statement to get the similarity (dice coefficient)
  			var sql = "select i.idDoc, 2*sum(q.tf * t.idf * i.tf * t.idf) / (dw.weight * qw.weight) as similarity from squery q, invertedindex i, terms t, weight_docs dw, weight_q qw where q.term = t.term AND i.term = t.term AND i.idDoc = dw.idDoc group by i.idDoc, dw.weight, qw.weight order by 2 desc";
			  con.query(sql, function (err, result) {
			    if (err) throw err;
			    console.log(result);
			    //We notify the state of the operation
			    io.sockets.emit ('messageSuccess', result);
			    console.log("---------------------------------");
			  });
  		}
  	});

//The server recieves the petition from the user to get the similarity of documents according to Log TFIDF and dot product
  	socket.on('getLogDot', function (auth) {
  		if(auth){
  			//SQL statement to get the similarity (dot product)
  			var sql = "select i.idDoc, sum((1 + log10(q.tf)) * t.idf * (1 + log10(i.tf)) * t.idf) as similarity from squery q, invertedindex i, terms t where q.term = t.term AND i.term = t.term group by i.IdDoc order by 2 desc";
			  con.query(sql, function (err, result) {
			    if (err) throw err;
			    console.log(result);
			    //We notify the state of the operation
			    io.sockets.emit ('messageSuccess', result);
			    console.log("---------------------------------");
			  });
  		}
  	});

//The server recieves the petition from the user to get the similarity of documents according to Log TFIDF and Dice coefficient
  	socket.on('getLogDice', function (auth) {
  		if(auth){
  			//SQL statement to get the similarity (dot product)
  			var sql = "select i.idDoc, 2*sum((1 + log10(q.tf)) * t.idf * (1 + log10(i.tf)) * t.idf) / (dw.weight * qw.weight) as similarity from squery q, invertedindex i, terms t, weight_docs dw, weight_q qw where q.term = t.term AND i.term = t.term AND i.idDoc = dw.idDoc group by i.idDoc, dw.weight, qw.weight order by 2 desc";
			  con.query(sql, function (err, result) {
			    if (err) throw err;
			    console.log(result);
			    //We notify the state of the operation
			    io.sockets.emit ('messageSuccess', result);
			    console.log("---------------------------------");
			  });
  		}
  	});



//The server recieves the petition from the user to get the efficiency of the program
  	socket.on('getPrecisionRecall', function (noQuery, docsRetrieved) {  
  	//Read the content of the file to get the relevant documents for the query	
  		fs.readFile('/Users/Raúl/Desktop/Recuperacion web/protoApp/cran1400/cranqrel.txt', 'utf8', function (err,data) {
  		//Variables to calculate precision and recall
  		var documents = [];
  		var efficiency = [];
  		var precision = -1;
	    var recall = -1;
	    var docRelevant = 0;
	      if (err) {
	        console.log(err);
	      }else {
	      	//Read each line of the document
	         var lines = data.split('\n');
	         for(var i=0;i<lines.length;i++){
	          var result = lines[i].split(' ');
	          //Is the document relevant?
	          if(result[0]==noQuery && result[2]<5) documents.push(result[1]);
	         }
	         var index = 1;
	         //Check the relevant documents
	         console.log(documents);
	         //We evaluate the retrived documents...
	         for(var i=0;i<docsRetrieved.length;i++){
	          if(documents.indexOf(docsRetrieved[i].toString()) != -1){ //Relevant document retrieved, then update precisio and recall
	            docRelevant++;
	            precision = docRelevant/(i+1);
	            recall = docRelevant/documents.length;
	            //We notify the state of the operation
	            console.log("Relevant document found: "+ docsRetrieved[i]);
	            //We generate the array used to create the CSV file
	            efficiency.push(docsRetrieved[i]);
	            efficiency.push(i+1);
	            efficiency.push(precision);
	            efficiency.push(recall);
	            //console.log("For document "+docsRetrieved[i]+" the precision is "+precision+" and recall is "+recall);
	            //Send the result of each iteration
	            io.sockets.emit ('messagePrecisionRecall', index,efficiency);
	            index++;
	            efficiency = [];
	          }
	         }
	          //We notify the state of the operation
	          console.log("Data for precision and recall sent")
			  console.log("---------------------------------");
			  //The server notify the user to generate the CSV
			  io.sockets.emit ('generateCSVPR', true);
	      }
	  	});
	});


  	socket.on('getFMeasure', function (noQuery, docsRetrieved) {  
  	//Read the content of the file to get the relevant documents for the query	
  		fs.readFile('/Users/Raúl/Desktop/Recuperacion web/protoApp/cran1400/cranqrel.txt', 'utf8', function (err,data) {
  		//Variables to calculate precision and recall
  		var documents = [];
  		var efficiency = [];
  		var precision = -1;
	    var recall = -1;
	    var docRelevant = 0;
	      if (err) {
	        console.log(err);
	      }else {
	      	//Read each line of the document
	         var lines = data.split('\n');
	         for(var i=0;i<lines.length;i++){
	          var result = lines[i].split(' ');
	          //Is the document relevant?
	          if(result[0]==noQuery && result[2]<5) documents.push(result[1]);
	         }
	         var index = 1;
	         //Check the relevant documents
	         console.log(documents);
	         //We evaluate the retrived documents...
	         for(var i=0;i<docsRetrieved.length;i++){
	          if(documents.indexOf(docsRetrieved[i].toString()) != -1){ //Relevant document retrieved, then update precision and recall
	            docRelevant++;
	            recall = docRelevant/documents.length;
	            //We notify the state of the operation
	            console.log("Relevant document found: "+ docsRetrieved[i]); 
	          }
	          //We generate the array used to create the CSV file
	            efficiency.push(docsRetrieved[i]);
	            efficiency.push(i+1);
	            precision = docRelevant/(i+1);
	            if(precision <= 0 ) efficiency.push('');
	            else efficiency.push(precision);
	            if(recall <= 0) efficiency.push('');
	            else efficiency.push(recall);
	            //console.log("For document "+docsRetrieved[i]+" the precision is "+precision+" and recall is "+recall);
	            //Send the result of each iteration
	            io.sockets.emit ('messageFMeasure', index,efficiency);
	            index++;
	            efficiency = [];
	         }
	          //We notify the state of the operation
	          console.log("Data for F-Measure sent")
			  console.log("---------------------------------");
			  //The server notify the user to generate the CSV
			  io.sockets.emit ('generateCSVF', true);
	      }
	  	});
	});

//The server recieves the petition from the user to get the information of documents from Docs
  	socket.on('getSnippetSearch', function (docsRetrieved) {
		//SQL statement to get the information for docs
		var sql;
		for(var i=0; i < docsRetrieved.length; i++){
			sql = "select title, abstract from docs where idDoc = " + docsRetrieved[i];
			  con.query(sql, function (err, result) {
			    if (err) throw err;
			    //console.log(result);
			    io.sockets.emit ('sendInformation', result);
			    console.log("Information sent!");
			  });
		}
  	});

//The server recieves the petition from the user to clean the tables
  	socket.on('cleanSQuery', function (really) {
		if(really){	
    	var sql = "truncate table squery";
		  con.query(sql, function (err, result) {
		  	//We notify the state of the operation
		    if (err) throw err;
		    console.log("Table SQuery cleaned!");
		  });
		}
  	});

  	socket.on('cleanWeight_docs', function (really) {
		if(really){	
    	var sql = "truncate table weight_docs";
		  con.query(sql, function (err, result) {
		  	//We notify the state of the operation
		    if (err) throw err;
		    console.log("Table Weight_docs cleaned!");
		  });
		}
  	});

  	socket.on('cleanWeight_q', function (really) {
		if(really){	
    	var sql = "truncate table weight_q";
		  con.query(sql, function (err, result) {
		  	//We notify the state of the operation
		    if (err) throw err;
		    console.log("Table Weight_q cleaned!");
		  });
		}
  	});
});

/* tf*idf
select i.IdDoc, t.term,(t.idf*i.tf)
from InvertedIndex i, Terms t
where  i.term = t.term
order by 1 asc
*/

/* dotproduct
select i.IdDoc, sum(q.tf * t.tfidf)
from SQuery q, TFIDF t
where q.term = t.term
group by i.IdDoc
order by 2 desc
*/
