const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

admin.initializeApp();

const firestore = admin.firestore();

const xpAoEscanear = 15; //xp ganho ao escanear um objeto novo
const xpAoAdicionar = 30; //xp ganho ao adicionar um objeto com sucesso
const xpAoAdicionarF = 15; //xp perdido quando um objeto é reprovado
const xpAoEditar = 20;
const xpAoEditarF = 10; //xp perdido quando a edição é desaprovada 
const xpAoAprovar = 15; //xp ganho ao aprovar algo
const xpAoReportar = 10; //xp ganho ao reportar algo que é aprovado

const xpEditar = 75; //xp necessário pra ter a habilidade de editar um objeto
const xpAdicionar = 810; //xp necessário pra ter a habilidade de adicionar um objeto
const xpGerenciador = 6960; //xp necessário pra ter a habilidade de ser gerenciador

//variáveis necessárias para enviar e-mails pela conta apptrimonio@gmail.com
const CLIENT_ID = '410454662647-dc4tmt9mvripdtbh5cpkh8rr2q104aec.apps.googleusercontent.com';
const CLIENT_SECRET = 'mF51HVaVzBjLn2SQhbmFNXxK';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04b_MhZ_nY06YCgYIARAAGAQSNwF-L9Irt_Lf2o_q8KKtf-Evt6UGXfKaP6jZFdXSIwsBgEpAQIwZcTHYfa9SwC6a8cj-V7a4P5M';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

//traduções das mensagens de e-mail (posição da array: 0: INGLÊS, 1 PORTUGUÊS E 2 ESPANHOL)
const assuntosAddAprovado = ["Apptrimônio: o seu objeto foi aprovado!", "Apptrimônio: o seu objeto foi aprovado!", "Apptrimônio: o seu objeto foi aprovado!"];
const assuntosAddDesaprovado = ["Apptrimônio: o seu objeto foi reprovado!", "Apptrimônio: o seu objeto foi reprovado!", "Apptrimônio: o seu objeto foi reprovado!"];
const assuntosEditAprovada = ["Apptrimônio: a sua edição foi aprovada!", "Apptrimônio: a sua edição foi aprovada!", "Apptrimônio: a sua edição foi aprovada!"];
const assuntosEditDesaprovada = ["Apptrimônio: a sua edição foi reprovada!", "Apptrimônio: a sua edição foi reprovada!", "Apptrimônio: a sua edição foi reprovada!"];
const assuntosReport = ["Apptrimônio: atualização sobre seu reporte.", "Apptrimônio: atualização sobre seu reporte.", "Apptrimônio: atualização sobre seu reporte."];
const assuntosObjRemovido = ["Apptrimônio: o seu objeto foi removido!", "Apptrimônio: o seu objeto foi removido!", "Apptrimônio: o seu objeto foi removido!"];
const assuntosObjEditado = ["Apptrimônio: o seu objeto foi editado!", "Apptrimônio: o seu objeto foi editado!", "Apptrimônio: o seu objeto foi editado!"];
const assuntosRemocaoAprovada = ["Apptrimônio: a sua remoção foi aprovada!", "Apptrimônio: a sua remoção foi aprovada!", "Apptrimônio: a sua remoção foi aprovada!"];
const assuntosVerificacaoEmail = ["Apptrimônio: verificação de e-mail.", "Apptrimônio: verificação de e-mail.", "Apptrimônio: verificação de e-mail."];

const mensagens1 = ["É possível visualizar o QRCode e editar informações do seu objeto dentro do seu perfil no aplicativo!", "É possível visualizar o QRCode e editar informações do seu objeto dentro do seu perfil no aplicativo!", "É possível visualizar o QRCode e editar informações do seu objeto dentro do seu perfil no aplicativo!"];
const mensagens2 = ["Caso não concorde com a análise feita pelo gerenciador, responda a este e-mail e iremos analisar novamente.", "Caso não concorde com a análise feita pelo gerenciador, responda a este e-mail e iremos analisar novamente.", "Caso não concorde com a análise feita pelo gerenciador, responda a este e-mail e iremos analisar novamente."];
const mensagens3 = ["Para mais informações, navegue até seus objetos na aba perfil dentro do aplicativo!", "Para mais informações, navegue até seus objetos na aba perfil dentro do aplicativo!", "Para mais informações, navegue até seus objetos na aba perfil dentro do aplicativo!"];
const mensagens4 = ["Obrigado por contribuir com o Apptrimônio!", "Obrigado por contribuir com o Apptrimônio!", "Obrigado por contribuir com o Apptrimônio!"];

const titulosAddAprovado = ["O objeto que você adicionou foi aprovado com sucesso!", "O objeto que você adicionou foi aprovado com sucesso!", "O objeto que você adicionou foi aprovado com sucesso!"];
const titulosAddAprovadoModificado = ["O objeto que você adicionou foi aprovado com modificações!", "O objeto que você adicionou foi aprovado com modificações!", "O objeto que você adicionou foi aprovado com modificações!"];
const titulosAddDesaprovado = ["Infelizmente, o objeto que você adicionou não foi aprovado!", "Infelizmente, o objeto que você adicionou não foi aprovado!", "Infelizmente, o objeto que você adicionou não foi aprovado!"];
const titulosEditAprovada = ["A sua edição foi aprovada!", "A sua edição foi aprovada!", "A sua edição foi aprovada!"];
const titulosEditAprovadaModificada = ["A sua edição foi aprovada com modificações!", "A sua edição foi aprovada com modificações!", "A sua edição foi aprovada com modificações!"];
const titulosEditDesaprovada = ["Infelizmente, a sua edição não foi aprovada!", "Infelizmente, a sua edição não foi aprovada!", "Infelizmente, a sua edição não foi aprovada!"];
const titulosObjRemovido = ["O seu objeto foi removido por um gerenciador!", "O seu objeto foi removido por um gerenciador!", "O seu objeto foi removido por um gerenciador!"];
const titulosObjEditado = ["O seu objeto foi editado por um gerenciador!", "O seu objeto foi editado por um gerenciador!", "O seu objeto foi editado por um gerenciador!"];
const titulosReportRemovido = ["O objeto que você reportou foi removido!", "O objeto que você reportou foi removido!", "O objeto que você reportou foi removido!"];
const titulosReportModificado = ["O objeto que você reportou foi modificado!", "O objeto que você reportou foi modificado!", "O objeto que você reportou foi modificado!"];
const titulosReportDesaprovado = ["O objeto que você reportou não sofreu alterações!", "O objeto que você reportou não sofreu alterações!", "O objeto que você reportou não sofreu alterações!"];
const titulosRemocaoAprovada = ["A remoção do objeto foi aprovada!", "A remoção do objeto foi aprovada!", "A remoção do objeto foi aprovada!"];

const naoInformado = ["Não informado.", "Não informado.", "Não informado."];

function userAddXp(dados) { //método que adiciona xp ao usuário e aumenta a quantidade de objetos verificados ou adicionados

    const uid = dados.uid;
    const ref = firestore.collection('usuarios').doc(uid);
    const idObjeto = dados.idObjeto;

    //a acao pode ser escanear (quando um usuário escaneia um qrcode)
    //pode ser adicionar (quando um usuário adiciona um objeto, quando o objeto desse usuário for aprovado ele GANHA xp e quando for DESAPROVADO ele PERDE XP)
    //pode ser edicao (apenas quando a edição de um usuário é DESAPROVADA ou APROVADA)
    //pode ser remover (quando um objeto é removido, o usuário que adicionou PERDE xp)
    //pode ser aprovar (quando um objeto é aprovado)
    const acao = dados.acao;
    const status = dados.status; //pode ser TRUE ou FALSE, TRUE adiciona POSITIVAMENTE e FALSE REMOVE xp!
    console.log("Adicionando xp a "+uid);

    ref.get().then(doc => {
        if (doc.exists) {
            const dados = doc.data();

            //define a quantidade de xp a ser adicionada ou removida
            let quantidade = 0;
            if (acao == "adicionar") { quantidade = status ? xpAoAdicionar : xpAoAdicionarF }
            else if (acao == "edicao") { quantidade = status ? xpAoEditar : xpAoEditarF }
            else if (acao == "remover") { quantidade = xpAoAdicionar }
            else if (acao == "escanear") { quantidade = xpAoEscanear }
            else if (acao == "aprovar") { quantidade = xpAoAprovar }
            else if (acao == "reportar") { quantidade = status ? xpAoReportar : 0 }

            //define se é positivo ou negativo
            quantidade = status ? quantidade : -quantidade;

            let objetosAdicionados = dados._objetosAdicionados;
            let objetosVerificados = dados._objetosVerificados;

            //define o xp final
            let xp = dados.xp + quantidade;
            ref.set({ xp: xp }, {merge: true});

            //adiciona ou remove 1 da quantidade de objetos adicionados, aprovados e removidos se for o caso
            if (acao == "adicionar") {
                if (status) { objetosAdicionados.push({ idObjeto: idObjeto, nomeObjeto: dados.nomeObjeto }) }
                ref.set({ _objetosAdicionados: objetosAdicionados }, {merge: true});
            }
            if (acao == "remover") {
                if (!status) { objetosAdicionados.splice(objetosAdicionados.indexOf({ idObjeto: idObjeto }), 1) }
                ref.set({ _objetosAdicionados: objetosAdicionados }, {merge: true});
            }
            if (acao == "aprovar") {
                if (status) { objetosVerificados.push({ idObjeto: idObjeto, nomeObjeto: nomeObjeto }); }
                ref.set({ _objetosVerificados: objetosVerificados }, {merge: true});
            }

        }
    })

};

async function enviarConfirmacao(dados) {
    const uid = dados.uid; //uid do usuário
    const lingua = dados.lingua;

    try {
        const user = await admin.auth().getUser(uid);
        if (user.emailVerified) {return "OK!"; };

        const link = await admin.auth().generateEmailVerificationLink(user.email);
        const assunto = assuntosVerificacaoEmail[lingua];
        //pega o template do banco de dados
        let emailTemplateDoc = await firestore.collection('templateEmails').doc('confirmacao').get();
        if (!emailTemplateDoc.exists) { return null; }

        let dadosEmail = emailTemplateDoc.data();
        let template = dadosEmail.EN;

        if (lingua == "1") { template = dadosEmail.PT } else if (lingua == "2") { template = dadosEmail.ES }

        //define as variaveis do objeto que serão enviadas
        const variaveis = {
            LINK: link
        };

        //replace nos placeholders
        const emailFinal = template.replace(/{\w+}/g, placeholder =>
            variaveis[placeholder.substring(1, placeholder.length - 1)] || placeholder);

        //envia o e-mail
        try {
            const accessToken = await oAuth2Client.getAccessToken();

            const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'apptrimonio@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLIENT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken
                }
            });

            const mailOptions = {
                from: 'Apptrimônio <apptrimonio@gmail.com>',
                to: user.email,
                subject: assunto,
                html: emailFinal
            };
            
            console.log("Enviando e-mail de confirmação para "+user.email);

            const result = await transport.sendMail(mailOptions);
            return result;
        } catch (error) {
            return error;
        }
    } catch (error) {
        console.log(error);
    }

}

async function enviarEmail(dados) { //método que envia um e-mail ao usuário, podendo ser de quando algo é aprovado, como a adição ou edição de um objeto

    const email = dados.email; //email que recebe
    const objeto = dados.objeto; //dados do objeto que será enviado no e-mail
    const titulo = dados.titulo; //titulo do e-mail
    const assunto = dados.assunto; //assunto do e-mail
    const mensagem = dados.mensagem; //mensagem do e-mail
    const lingua = dados.lingua; //0 INGLES, 1 PORTUGUES, 2 ESPANHOL

    //verifica se o usuário possui e-mails desabilitados
    const emailUser = await admin.auth().getUserByEmail(email).then(user =>{
        return firestore.collection('usuarios').doc(user.uid).get().then(doc =>{
            if(doc.exists){
                return doc.data().receberEmails;
            }
            return false;
        })
    })

    if (!emailUser) { return null; } //caso estiver desabilitado não executa o resto

    //pega o template do banco de dados
    let emailTemplateDoc = await firestore.collection('templateEmails').doc('objeto').get();
    if (!emailTemplateDoc.exists) { return null; }

    let dadosEmail = emailTemplateDoc.data();
    let template = dadosEmail.EN;

    if (lingua == 1) { template = dadosEmail.PT } else if (lingua == 2) { template = dadosEmail.ES }

    //define as variaveis do objeto que serão enviadas
    const variaveis = {
        IMAGEM: objeto.imagem == undefined ? "https://v0.static.betalabs.com.br/ecommerce/maxibanho/img/unavailable-m.jpg" : "data:image/png;base64," + objeto.imagem,
        NOME: objeto.nome == undefined ? naoInformado[lingua] : objeto.nome,
        VALOR: objeto.valor == undefined ? naoInformado[lingua] : objeto.valor,
        CATEGORIA: objeto.categoria == undefined ? naoInformado[lingua] : objeto.categoria,
        COMPRA: objeto.compra == undefined ? naoInformado[lingua] : objeto.compra,
        LOCAL: objeto.local == undefined ? naoInformado[lingua] : objeto.local,
        VALORSENTIMENTAL: objeto.valorSentimental == undefined ? naoInformado[lingua] : objeto.valorSentimental,
        DESCRICAOIMAGEM: objeto.descricaoImagem == undefined ? naoInformado[lingua] : objeto.descricaoImagem,
        TITULO: titulo,
        DESCRICAO: objeto.descricao == undefined ? naoInformado[lingua] : objeto.descricao,
        MENSAGEM: mensagem
    };

    //replace nos placeholders
    const emailFinal = template.replace(/{\w+}/g, placeholder =>
        variaveis[placeholder.substring(1, placeholder.length - 1)] || placeholder);

    //envia o e-mail
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'apptrimonio@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        const mailOptions = {
            from: 'Apptrimônio <apptrimonio@gmail.com>',
            to: email,
            subject: assunto,
            html: emailFinal
        };

        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        return error;
    }
}

exports.enviarEmailConfirmacao = functions.https.onRequest((request, response) => { //quando o usuário deseja confirmar o e-mail

    //dados do usuário
    const token = request.body.token;
    const lingua = request.body.lingua;

    //verifica se tem as variáveis necessárias
    if (lingua == null || token == undefined) { return response.status(400).send("Bad request."); }

    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const uid = decodedToken.uid;

        enviarConfirmacao({ uid: uid, lingua: lingua });
        return response.status(200).send("OK!");

    }).catch(() => {//caso não for um token válido (não for um usuário)
        return response.status(200).send(resposta); //envia a response como objeto padrão (sem gerenciador, xp e badges)
    });
});

exports.receberEmails = functions.https.onRequest((request, response) => { //função chamada ao ativar ou desativar o recebimento de emails

    //váriaveis recebidas do usuário
    const token = request.body.token; //token do usuário
    const status = request.body.status; //TRUE caso quiser receber e-mails e FALSE caso não quiser

    status = status == true || status == false ? status : true;

    return admin.auth().verifyIdToken(token).then(decodedToken => {

        const uid = decodedToken.uid;
        const userRef = firestore.collection('usuarios').doc(uid);

        userRef.set({ receberEmails: status }, {merge: true});

        return response.status(200).send({ status: status });

    }).catch(() => {
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });
});

exports.verificarConta = functions.https.onRequest((request, response) => { //função para verificar se o usuário é gerenciador ou não

    const token = request.body.token; //recebe o token do usuário
    const lingua = request.body.lingua != 0 && request.body.lingua != 1 && request.body.lingua != 2 ? 0 : request.body.lingua;

    var resposta = { //resposta que será enviada ao cliente
        gerenciador: false,
        editar: false,
        adicionar: false,
        receberEmails: false,
        xp: 0,
        _codigos: [],
        objetosAdicionados: [],
        objetosVerificados: []
    };

    //decodifica o token do usuário para ver se é realmente um usuário
    return admin.auth().verifyIdToken(token).then((decodedToken) => {
        const uid = decodedToken.uid; //token do usuário
        const emailVerificado = decodedToken.email_verified;

        return firestore.collection('usuarios').doc(uid).get().then(doc => { //pega as informações do usuário na tabela usuarios

            if (doc.exists) { //caso esteja presente na tabela
                const dados = doc.data();

                resposta.xp = dados.xp; //define a experiencia
                resposta.codigos = dados._codigos; //define os códigos que o usuário já escaneou
                resposta.objetosAdicionados = dados._objetosAdicionados; //quantidade de objetos que o usuário adicionou
                resposta.objetosVerificados = dados._objetosVerificados; //quantidade de objetos que o usuário verificou
                resposta.gerenciador = dados.xp >= xpGerenciador ? true : false; //define se o usuário possui permissão de gerenciador
                resposta.editar = dados.xp >= xpEditar ? true : false; //define se o usuário possui permissão de editar
                resposta.adicionar = dados.xp >= xpAdicionar ? true : false; //define se o usuário possui permissão de adicionar
                resposta.receberEmails = dados.receberEmails;


            } else { //caso não esteja presente na tabela cria o usuário

                firestore.collection('usuarios').doc(uid).create({
                    xp: 0,
                    _codigos: [],
                    _objetosAdicionados: [],
                    _objetosVerificados: [],
                    email: decodedToken.email,
                    receberEmails: true
                });
                
                console.log("email verificado: "+emailVerificado);

                //envia o e-mail de confirmação após criar o usuário caso não estiver verificado
                if (!emailVerificado) {
                    console.log("enviando email");
                    enviarConfirmacao({ uid: uid, lingua: lingua });
                }
            }
            return response.status(200).send(resposta);
        });

    }).catch(() => { //caso não for um token válido (não for um usuário)
        return response.status(200).send(resposta); //envia a response como objeto padrão (sem gerenciador, xp e badges)
    });

});

exports.requisitarObjeto = functions.https.onRequest((request, response) => { //função para verificar se o objeto requisitado existe e retornar ao usuário

    const idObjeto = request.body.idObjeto.trim(); //id do objeto que o usuário envia
    const token = request.body.token; //recebe o token do usuário caso existir

    if (idObjeto == undefined) { //verifica se o id realmente tem algo
        return response.status(400).send({status: "Bad request."});
    }

    return firestore.collection('objetos').doc(idObjeto).get().then(doc => { //pega o documento do banco de dados

        if (doc.exists) { //caso o objeto exista no banco de dados

            const data = doc.data(); //pega os dados do documento

            //verifica se o objeto foi aprovado
            const desaprovado = {
                status: data._aprovacao,
                motivo: data._status
            };

            if(data._aprovacao == "desaprovado" || data._aprovacao == "andamento" || data._aprovacao == "excluido"){
                return response.status(404).send(desaprovado);
            }

            var objeto = { //cria um novo objeto com os dados
                lingua: data._lingua,
                imagem: data._imagem,
                categoria: data.categoria,
                compra: data.compra,
                descricaoImagem: data.descricaoImagem,
                _aprovadoEm: data._aprovadoEm,
                descricao: data.descricao,
                local: data.local,
                nome: data.nome,
                valor: data.valor,
                valorSentimental: data.valorSentimental
            };

            //caso estiver um usuário logado adiciona o objeto aos objetos escaneados e adiciona xp
            if (token != undefined) {
                admin.auth().verifyIdToken(token).then(decodedToken =>{
                    const uid = decodedToken.uid;
                    const userRef = firestore.collection('usuarios').doc(uid);
                    userRef.get().then(doc =>{
                        if(doc.exists){
                            let xp = doc.data().xp;
                            let codigos = doc.data()._codigos;

                            //caso não tenha escaneado esse código
                            if(!codigos.includes(idObjeto)){
                                codigos.push(idObjeto);
                                xp += xpAoEscanear;
                                userRef.set({
                                    xp: xp,
                                    _codigos: codigos
                                }, {merge: true});
                            }
                        }
                    })
                });
            }
            //retorna o objeto
            return response.status(200).send(objeto);

        } else { //caso o objeto não exista no banco de dados
            return response.status(404).send("Object not found!");
        }
    });
});

exports.adicionarObjeto = functions.https.onRequest((request, response) => { //função para adicionar um objeto

    //variaveis recebidas
    const nome = request.body.nome;
    const categoria = request.body.categoria;
    const dataCompra = request.body.dataCompra;
    const valor = request.body.valor;
    const local = request.body.local;
    const descricaoImagem = request.body.descricaoImagem;
    const valorSentimental = request.body.valorSentimental;
    const lingua = request.body.lingua;
    const descricao = request.body.descricao;

    const imagem = request.body.imagem;
    const token = request.body.token;

    //verifica se o token do usuário é válido
    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const emailVerificado = decodedToken.email_verified;

        if (nome == undefined || categoria == undefined || valor == undefined || imagem == undefined || local == undefined || descricaoImagem == undefined || lingua == undefined) {
            return response.status(400).send("Bad request."); //caso faltar algum campo
        }

        //verifica se o usuário possui permissão pra adicionar objeto
        return firestore.collection('usuarios').doc(uid).get().then(doc => {

            if (!doc.exists) { //caso não existir o arquivo
                return response.status(401).send("Unauthorized.");
            }

            if (!emailVerificado) { return response.status(401).send("Email not verified."); } //verifica se o email está verificado

            const xp = doc.data().xp;

            if (xp < xpAdicionar) { //caso não possuir permissão
                return response.status(401).send("Unauthorized.");
            }

            const objeto = {
                _adicionadoPor: email,
                _adicionadoPorUID: uid,
                _aprovacao: "andamento",
                _aprovadoPor: null,
                _aprovadoPorUID: null,
                _aprovadoEm: null,
                editores: [],
                nome: nome,
                _imagem: imagem,
                _lingua: lingua,
                categoria: categoria,
                compra: dataCompra,
                descricaoImagem: descricaoImagem,
                descricao: descricao,
                local: local,
                valor: valor,
                valorSentimental: valorSentimental
            };

            const refObjeto = firestore.collection('objetos').doc();

            //caso for gerenciador (não precisa de aprovação de gerenciador)
            if (xp >= xpAdicionar) {
                objeto._aprovacao = "aprovado";
                objeto._aprovadoPor = email;
                objeto._adicionadoPorUID = uid;
                objeto._aprovadoEm = admin.database.ServerValue.TIMESTAMP;

                //adiciona o xp e o objeto no usuário
                userAddXp({ uid: uid, acao: 'adicionar', status: true, idObjeto: refObjeto.id, nomeObjeto: nome });

                //enviar email a quem adicionou
                enviarEmail({ email: email, objeto: { IMAGEM: imagem, CATEGORIA: categoria, COMPRA: dataCompra, DESCRICAOIMAGEM: descricaoImagem, DESCRICAO: descricao, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosAddAprovado[lingua], assunto: assuntosAddAprovado[lingua], mensagem: mensagens1[lingua], lingua: lingua });

            } else { //caso não for gerenciador (precisa de aprovação de gerenciador)

                //adicionar objeto em andamento no banco de dados "andamento"
                const refAndamento = firestore.collection('andamento').doc();
                refAndamento.create({
                    idObjeto: refObjeto.id,
                    tipo: 'add'
                });
            }

            //adiciona o objeto ao banco de dados e retorna o id dele
            refObjeto.create(objeto);

            return response.status(200).send(refObjeto.id);

        });

    }).catch(() => {
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });

});

exports.editarObjeto = functions.https.onRequest((request, response) => { //função para editar um objeto

    //valores que o usuário envia
    const token = request.body.token;
    const idObjeto = request.body.idObjeto;

    let imagem = request.body.imagem;
    let categoria = request.body.categoria;
    let compra = request.body.compra;
    let descricaoImagem = request.body.descricaoImagem;
    let local = request.body.local;
    let nome = request.body.nome;
    let valor = request.body.valor;
    let valorSentimental = request.body.valorSentimental;
    let lingua = request.body.lingua;
    let descricao = request.body.descricao;

    //caso o token ou o id do objeto não foi enviado
    if (token == undefined || idObjeto == undefined) { return response.status(400).send("Bad request.") }

    //verifica se o token do usuário é válido
    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const emailVerificado = decodedToken.email_verified;
        const userRef = firestore.collection('usuarios').doc(uid);
        const andamentoRef = firestore.collection('andamento').doc();
        const objetoRef = firestore.collection('objetos').doc(idObjeto);

        if (!emailVerificado) { return response.status(401).send("Email not verified."); } //verifica se o email está verificado

        //pega o xp do usuário
        return userRef.get().then(userDoc => {

            //caso não existir o arquivo do usuário
            if (!userDoc.exists) { return response.status(401).send("Unauthorized."); }

            const xp = userDoc.data().xp;

            //caso não possuir permissão para editar um objeto
            if (xp < xpEditar) { return response.status(401).send("Unauthorized."); }

            //caso não possuir permissão de gerenciador adiciona em andamento
            if (xp < xpGerenciador) {
                andamentoRef.create({
                    _editadoPor: email,
                    _editadoPorUID: uid,
                    _lingua: lingua,
                    editCategoria: categoria,
                    editCompra: compra,
                    editDescricaoImagem: descricaoImagem,
                    editImagem: imagem,
                    editLocal: local,
                    editNome: nome,
                    editValor: valor,
                    descricao: descricao,
                    editValorSentimental: valorSentimental,
                    idObjeto: idObjeto,
                    tipo: 'edit'
                });

            } else {
                //caso possuir gerenciador obtém os dados do objeto
                objetoRef.get().then(objetoDoc => {

                    //caso não existir o objeto
                    if (!objetoDoc.exists) { return response.status(404).send("Object not found!"); }

                    const dadosObjeto = objetoDoc.data();
                    const criadoPor = dadosObjeto._adicionadoPor;

                    //define a lingua do objeto
                    const lingua = dadosObjeto._lingua;
                    if (lingua == "pt") { lingua = 1 } else if (lingua == "es") { lingua == 2; } else { lingua = 0; }

                    let editores = dadosObjeto._editores;
                    editores.push(email);
                    imagem = imagem != undefined ? imagem : dadosObjeto._imagem;
                    categoria = categoria != undefined ? categoria : dadosObjeto.categoria;
                    compra = compra != undefined ? compra : dadosObjeto.compra;
                    descricaoImagem = descricaoImagem != undefined ? descricaoImagem : dadosObjeto.descricaoImagem;
                    local = local != undefined ? local : dadosObjeto.local;
                    nome = nome != undefined ? nome : dadosObjeto.nome;
                    valor = valor != undefined ? valor : dadosObjeto.valor;
                    valorSentimental = valorSentimental != undefined ? valorSentimental : dadosObjeto.valorSentimental;
                    descricao = descricao != undefined ? descricao : dadosObjeto.descricao;

                    //seta os valores no objeto
                    objetoRef.set({
                        _editores: editores,
                        _imagem: _imagem,
                        categoria: categoria,
                        compra: compra,
                        descricaoImagem: descricaoImagem,
                        local: local,
                        nome: nome,
                        descricao: descricao,
                        valor: valor,
                        valorSentimental: valorSentimental
                    }, {merge: true});

                    //envia e-mail a quem editou
                    enviarEmail({ email: email, objeto: { IMAGEM: imagem, DESCRICAO: descricao, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosEditAprovada[lingua], assunto: assuntosEditAprovada[lingua], mensagem: mensagens4[lingua], lingua: lingua });
                    //envia e-mail a quem criou
                    enviarEmail({ email: criadoPor, objeto: { IMAGEM: imagem, DESCRICAO: descricao, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosObjEditado[lingua], assunto: assuntosObjEditado[lingua], mensagem: mensagens1[lingua], lingua: lingua });

                });
            }

            //retorna ok
            return response.status(200).send("OK!");

        });

    }).catch(() => {
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });

});

exports.removerObjeto = functions.https.onRequest((request, response) => { //função para remover um objeto

    const idAndamento = request.body.idAndamento;
    const idObjeto = request.body.idObjeto; //recebe o id do objeto a ser excluido
    const token = request.body.token; //recebe o token do usuário que quer remover o objeto
    const motivo = request.body.motivo; //recebe o motivo da remoção do objeto

    if (idObjeto == undefined || token == undefined || motivo == undefined) { return response.status(404).send("Bad request."); } //caso o usuário não enviou um dos parametros

    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const uid = decodedToken.uid; //uid do usuário
        const email = decodedToken.email;
        const emailVerificado = decodedToken.email_verified;

        if (!emailVerificado) { return response.status(401).send("Email not verified."); } //verifica se o email está verificado

        const refUser = firestore.collection('usuarios').doc(uid);
        const refObjeto = firestore.collection('objetos').doc(idObjeto);

        //pega o objeto do banco de dados
        return refObjeto.get().then(doc => {

            if (!doc.exists) { //caso o objeto não exista
                return response.status(404).send("Object not found!");
            }

            const dataObj = doc.data();
            const lingua = dataObj._lingua;
            if (lingua == "pt") { lingua = 1; } else if (lingua == "es") { lingua = 2; } else { lingua = 0; }

            const editores = dataObj._editores;
            editores.push(email);

            //verifica se o usuário possui XP suficiente para ser gerenciador
            return refUser.get().then(docUser => {
                if (!docUser.exists) { return response.status(401).send("Unauthorized."); }

                const xp = docUser.data().xp;

                if (xp < xpGerenciador && uid != dataObj._adicionadoPorUID) { return response.status(401).send("Unauthorized."); } //caso não for o criador do objeto ou gerenciador

                //exclui o objeto
                refObjeto.set({
                    _aprovacao: 'excluido',
                    _status: motivo,
                    _excluidoEm: admin.database.ServerValue.TIMESTAMP,
                    _excluidoPor: email,
                    _excluidoPorUID: uid
                }, {merge: true});

                //caso a exclusão for proveniente de um report (remove o objeto em andamento, adiciona xp a quem reportou e remove de quem adicionou e envia email)
                if (idAndamento != undefined) {

                    //pega o objeto em andamento do banco de dados
                    const refAndamento = firestore.collection('andamento').doc(idAndamento);
                    refAndamento.get().then(docAndamento => {

                        if (docAndamento.exists) {
                            const dataAndamento = docAndamento.data();
                            const tipo = dataAndamento.tipo;
                            const quemAdicionou = dataAndamento._adicionadoPor;
                            const quemAdicionouUID = dataAndamento._adicionadoPorUID;
                            const quemReportou = dataAndamento._reportadoPor;
                            const quemReportouUID = dataAndamento._reportadoPorUID;

                            if (tipo == "report") { //caso for report

                                //remove o objeto
                                refAndamento.delete();

                                //adiciona xp a quem reportou, ao gerenciador e remove de quem adicionou
                                userAddXp({ uid: uid, acao: 'aprovar', status: true, idObjeto: idAndamento });
                                userAddXp({ uid: quemAdicionouUID, acao: 'remover', status: false, idObjeto: idAndamento });
                                userAddXp({ uid: quemReportouUID, acao: 'reportar', status: true, idObjeto: idAndamento });

                                //envia email a quem reportou
                                enviarEmail({ email: quemReportou, objeto: { IMAGEM: dataObj._imagem, DESCRICAO: dataObj.descricao, CATEGORIA: dataObj.categoria, COMPRA: dataObj.compra, DESCRICAOIMAGEM: dataObj.descricaoImagem, LOCAL: dataObj.local, VALOR: dataObj.valor, VALORSENTIMENTAL: dataObj.valorSentimental, NOME: dataObj.nome }, titulo: titulosReportRemovido[lingua], assunto: assuntosReport[lingua], mensagem: mensagens4[lingua], lingua: lingua });

                            }
                        }
                    });
                }

                //remove xp do criador
                userAddXp({ uid: dataObj._adicionadoPorUID, status: false, acao: 'remover' });

                //envia e-mail a quem criou
                enviarEmail({ email: quemReportou, objeto: { IMAGEM: dataObj._imagem, DESCRICAO: dataObj.descricao,CATEGORIA: dataObj.categoria, COMPRA: dataObj.compra, DESCRICAOIMAGEM: dataObj.descricaoImagem, LOCAL: dataObj.local, VALOR: dataObj.valor, VALORSENTIMENTAL: dataObj.valorSentimental, NOME: dataObj.nome }, titulo: titulosObjRemovido[lingua], assunto: assuntosObjRemovido[lingua], mensagem: mensagens2[lingua], lingua: lingua });
                //envia e-mail a quem removeu
                enviarEmail({ email: quemReportou, objeto: { IMAGEM: dataObj._imagem,DESCRICAO: dataObj.descricao, CATEGORIA: dataObj.categoria, COMPRA: dataObj.compra, DESCRICAOIMAGEM: dataObj.descricaoImagem, LOCAL: dataObj.local, VALOR: dataObj.valor, VALORSENTIMENTAL: dataObj.valorSentimental, NOME: dataObj.nome }, titulo: titulosRemocaoAprovada[lingua], assunto: assuntosRemocaoAprovada[lingua], mensagem: mensagens4[lingua], lingua: lingua });

                return response.status(200).send("OK!");
            });

        });
    }).catch((error) => {
        console.log(error);
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });
});

exports.objetosAndamento = functions.https.onRequest((request, response) => { //função para receber todos os objetos que precisam ser aprovados

    //recebe token do usuário
    const token = request.body.token;
    const andamentoRef = firestore.collection('andamento');

    //verifica se o token é válido
    return admin.auth().verifyIdToken(token).then(decodedToken => {


        const emailVerificado = decodedToken.email_verified;
        const uid = decodedToken.uid;
        if (!emailVerificado) { return response.status(401).send("Email not verified."); } //verifica se o email está verificado

        //verifica se o usuário possui permissão de gerenciador
        return firestore.collection('usuarios').doc(uid).get().then(docUser => {
            if (!docUser.exists) { return response.status(401).send("Unauthorized."); }

            const xp = docUser.data().xp;
            if (xp < xpGerenciador) { return response.status(401).send("Unauthorized."); } //caso o usuário não possuir permissão de gerenciador

            //pega os objetos em andamento
            return andamentoRef.get().then(docs => {

                //verifica se há objetos
                if (docs.size == 0) { return response.status(200).send("There are no objects available.") }

                //calcula quantos objetos será retornado
                const retornarObjetos = docs.size >= 3 ? 3 : docs.size; //quantos objetos serão retornados, com o máximo de 3
                const indexObjetos = Math.floor(Math.random() * (docs.size - retornarObjetos));

                //cria a array de objetos, adiciona os objetos e retorna como resposta
                const objetos = [];
                for (let i = indexObjetos; i < retornarObjetos; i++) { objetos.push(docs.docs[i].data()); }
                return response.status(200).send(objetos);
            });
        })

    }).catch(() => {
        //envia a response como erro (token inválido)
        return response.status(401).send("Unauthorized.");
    });

});

exports.aprovacaoObjeto = functions.https.onRequest((request, response) => { //função para aprovar ou desaprovar um objeto
    const token = request.body.token;
    const idAndamento = request.body.token;
    const motivo = request.body.token;
    const valoresAprovar = request.body.valoresAprovar; //valores recebidos caso o objeto tenha valores diferentes do original 
    const status = request.body.status; //valor TRUE para objeto APROVADO e FALSE para DESAPROVADO

    const reportRef = firestore.collection('andamento').doc(idAndamento);

    //caso o usuário não enviou token, status, o id andamento ou então o motivo (caso for desaprovado)
    if (idAndamento == undefined || status == undefined || (status != true && status != false) || token == undefined || (motivo == undefined && !status)) { return response.status(400).send("Bad request."); }

    //verifica se o token é válido
    admin.auth().verifyIdToken(token).then(decodedToken => {

        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const emailVerificado = decodedToken.email_verified;

        //verifica se o usuário é gerenciador
        return firestore.collection('usuarios').doc(uid).get().then(docUser => {
            if (!docUser.exists || !emailVerificado) { return response.status(401).send("Unauthorized."); } //caso o email não estiver verificado ou não existir
            if (docUser.data().xp < xpGerenciador) { return response.status(401).send("Unauthorized."); } //caso não possuir permissão de gerenciador

            //pega o objeto em andamento do banco de dados
            return reportRef.get().then(docAndamento => {
                if (!docAndamento.exists) { return response.status(404).send("Object not found!"); } //caso o id do objeto em andamento não exista

                const dadosObjetoAndamento = docAndamento.data();
                const tipoObjetoAndamento = dadosObjetoAndamento.tipo;
                const idObjetoAndamento = dadosObjetoAndamento.idObjeto;
                const refObjeto = firestore.collection('objetos').doc(idObjetoAndamento);

                return refObjeto.get().then(docObjeto => {

                    //verifica se o objeto existe
                    if (!docAndamento.exists) {
                        //caso não existir deleta o objeto em andamento e retorna erro
                        reportRef.delete();
                        return response.status(404).send("Object not found!");
                    }

                    const dataObjeto = docObjeto.data();
                    const lingua = dataObjeto._lingua;

                    //verifica se o objeto foi excluído (exclui o objeto em andamento e retorna erro)
                    if (dataObjeto._aprovacao == "excluido") { response.status(404).send("The object has been deleted."); }

                    //dados do objeto que podem ser editados caso necessário
                    const uidAdicionou = dataObjeto._adicionadoPorUID;
                    const emailAdicionou = dataObjeto._adicionadoPor;
                    const editores = dataObjeto._editores;
                    editores.push(email); //adiciona o usuário aos editores
                    const imagem = valoresAprovar.imagem == undefined ? dataObjeto._imagem : valoresAprovar.imagem;
                    const categoria = valoresAprovar.categoria == undefined ? dataObjeto.categoria : valoresAprovar.categoria;
                    const compra = valoresAprovar.compra == undefined ? dataObjeto.compra : valoresAprovar.compra;
                    const descricaoImagem = valoresAprovar.descricaoImagem == undefined ? dataObjeto.descricaoImagem : valoresAprovar.descricaoImagem;
                    const local = valoresAprovar.local == undefined ? dataObjeto.local : valoresAprovar.local;
                    const nome = valoresAprovar.nome == undefined ? dataObjeto.nome : valoresAprovar.nome;
                    const valor = valoresAprovar.valor == undefined ? dataObjeto.valor : valoresAprovar.valor;
                    const valorSentimental = valoresAprovar.valorSentimental == undefined ? dataObjeto.valorSentimental : valoresAprovar.valorSentimental;
                    const descricao = valoresAprovar.descricao == undefined ? dataObjeto.descricao : valoresAprovar.descricao;

                    const modificado = valoresAprovar.imagem != undefined || valoresAprovar.categoria != undefined || valoresAprovar.compra != undefined
                        || valoresAprovar.descricaoImagem != undefined || valoresAprovar.local != undefined || valoresAprovar.nome != undefined
                        || valoresAprovar.valor != undefined || valoresAprovar.valorSentimental != undefined ? true : false;

                    //caso for andamento de objeto adicionado (foi adicionado por um usuário sem gerenciador)
                    if (tipoObjetoAndamento == "add") {

                        //remove o objeto em andamento
                        reportRef.delete();

                        //aprova ou desaprova o objeto
                        if (status) {
                            refObjeto.set({
                                _aprovacao: "aprovado",
                                _aprovadoEm: admin.database.ServerValue.TIMESTAMP,
                                _aprovadoPor: email,
                                _aprovadoPorUID: uid,
                                _editores: editores,
                                _imagem: imagem,
                                categoria: categoria,
                                compra: compra,
                                descricaoImagem: descricaoImagem,
                                local: local,
                                nome: nome,
                                valor: valor,
                                descricao: descricao,
                                valorSentimental: valorSentimental
                            }, {merge: true});

                            //envia e-mail a quem criou (add aprovado)
                            const titulo = modificado ? titulosAddAprovadoModificado[lingua] : titulosAddAprovado[lingua];
                            enviarEmail({ email: emailAdicionou, objeto: { IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulo, assunto: assuntosAddAprovado[lingua], mensagem: mensagens1[lingua], lingua: lingua });
                        } else {
                            refObjeto.set({
                                _aprovacao: "desaprovado",
                                _aprovadoEm: admin.database.ServerValue.TIMESTAMP,
                                _aprovadoPor: email,
                                _aprovadoPorUID: uid,
                                _editores: editores,
                                status: motivo,
                            }, {merge: true});

                            //envia e-mail a quem criou (add desaprovado)
                            enviarEmail({ email: emailAdicionou, objeto: { DESCRICAO: descricao, IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosAddDesaprovado[lingua], assunto: assuntosAddDesaprovado[lingua], mensagem: mensagens2[lingua], lingua: lingua });
                        }

                        //adiciona xp a quem aprovou e quem adicionou
                        userAddXp({ uid: uid, idObjeto: idObjetoAndamento, status: true, acao: "aprovar" });
                        userAddXp({ uid: uidAdicionou, idObjeto: idObjetoAndamento, status: status, acao: "adicionar" });

                        //retorna ok
                        return response.status(200).send("OK!");
                    } else if (tipoObjetoAndamento == "report") { //caso for report (algum usuário reportou)

                        const quemReportouUID = dataObjeto._reportadoPorUID;
                        const quemReportou = dataObjeto._reportadoPor;

                        //remove o objeto em andamento
                        reportRef.delete();

                        //caso for aprovado a edição, edita as variaveis
                        if (status) {
                            refObjeto.set({
                                _editores: editores,
                                _imagem: imagem,
                                categoria: categoria,
                                compra: compra,
                                descricaoImagem: descricaoImagem,
                                descricao: descricao,
                                local: local,
                                nome: nome,
                                valor: valor,
                                valorSentimental: valorSentimental
                            }, {merge: true});

                            //envia e-mail a quem reportou e a quem adicionou e foi modificado
                            enviarEmail({ email: emailAdicionou, objeto: { DESCRICAO: descricao,IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosObjEditado[lingua], assunto: assuntosObjEditado[lingua], mensagem: mensagens3[lingua], lingua: lingua });
                            enviarEmail({ email: quemReportou, objeto: { DESCRICAO: descricao,IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosReportModificado[lingua], assunto: assuntosReport[lingua], mensagem: mensagens4[lingua], lingua: lingua });
                        } else {
                            //envia e-mail a quem reportou e não foi modificado
                            enviarEmail({ email: quemReportou, objeto: { DESCRICAO: descricao,IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosReportDesaprovado[lingua], assunto: assuntosReport[lingua], mensagem: mensagens4[lingua], lingua: lingua });
                        }


                        //adiciona XP ao gerenciador que aprovou e a quem reportou
                        userAddXp({ uid: uid, idObjeto: idObjetoAndamento, status: true, acao: "aprovar" });
                        userAddXp({ uid: quemReportouUID, idObjeto: idObjetoAndamento, status: true, acao: "reportar" });

                        //retorna ok
                        return response.status(200).send("OK!");
                    } else if (tipoObjetoAndamento == "edit") { //caso o objeto em andamento for edit (um usuário sem gerenciador editou)

                        const quemEditou = dataObjeto._editadoPor;
                        const quemEditouUID = dataObjeto._editadoPorUID;

                        //remove o objeto em andamento
                        reportRef.delete();

                        //edita as variáveis caso aprovado
                        if (status) {
                            refObjeto.set({
                                _editores: editores,
                                _imagem: imagem,
                                categoria: categoria,
                                compra: compra,
                                descricaoImagem: descricaoImagem,
                                local: local,
                                nome: nome,
                                valor: valor,
                                descricao: descricao,
                                valorSentimental: valorSentimental
                            }, {merge: true});

                            //envia e-mail a quem editou e foi aprovado e a quem adicionou
                            const titulo = modificado ? titulosEditAprovadaModificada[lingua] : titulosEditAprovada[lingua];
                            enviarEmail({ email: emailAdicionou, objeto: { DESCRICAO: descricao,IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosObjEditado, assunto: assuntosObjEditado[lingua], mensagem: mensagens3[lingua], lingua: lingua });
                            enviarEmail({ email: quemEditou, objeto: { DESCRICAO: descricao,IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulo, assunto: assuntosEditAprovada[lingua], mensagem: mensagens4[lingua], lingua: lingua });
                        } else {

                            //envia e-mail a quem editou e e não foi aprovado
                            enviarEmail({ email: quemEditou, objeto: { DESCRICAO: descricao,IMAGEM: imagem, CATEGORIA: categoria, COMPRA: compra, DESCRICAOIMAGEM: descricaoImagem, LOCAL: local, VALOR: valor, VALORSENTIMENTAL: valorSentimental, NOME: nome }, titulo: titulosEditDesaprovada[lingua], assunto: assuntosEditDesaprovada[lingua], mensagem: mensagens4[lingua], lingua: lingua });
                        }

                        //adiciona xp a quem editou e ao gerenciador que aprovou
                        userAddXp({ uid: uid, idObjeto: idObjetoAndamento, status: true, acao: "aprovar" });
                        userAddXp({ uid: quemEditouUID, idObjeto: idObjetoAndamento, status: status, acao: "edicao" });

                        //retorna ok
                        response.status(200).send("OK!");
                    }

                    //caso não retornar valor dos IFs é por que tem algo errado
                    return response.status(500).send("An error occured!");
                });
            });
        });

    }).catch(() => {
        //envia a response como erro (token inválido)
        return response.status(401).send("Unauthorized.");
    });
});

exports.reportarObjeto = functions.https.onRequest((request, response) => { //função pra reportar um objeto

    //valores enviados pelo usuário
    const token = request.body.token;
    const idObjeto = request.body.idObjeto;
    const motivo = request.body.motivo;

    //caso o usuário não enviar o token, o id do objeto e o motivo do report
    if (token == undefined || idObjeto == undefined || motivo == undefined) { return response.status(404).send("Bad request."); }

    //verifica se o token é válido
    return admin.auth().verifyIdToken(token).then(decodedToken => {

        //dados do usuário
        const uid = decodedToken.uid;
        const emailVerificado = decodedToken.email_verified;
        const email = decodedToken.email;

        //verifica se o email do usuário é verificado
        if (!emailVerificado) { return response.status(401).send("Email not verified."); }

        const objetoRef = firestore.collection('objetos').doc(idObjeto);
        const reportRef = firestore.collection('andamento');

        //pega as informações do objeto
        return objetoRef.get().then(doc => {
            if (!doc.exists) { //verifica se o objeto existe
                return response.status(404).send("Object not found!");
            }

            const data = doc.data();
            const adicionouUID = data._adicionadoPorUID;
            const adicionou = data._adicionadoPor;
            const reportDocRef = reportRef.doc();

            //adiciona o report ao banco de dados
            reportDocRef.create({
                _adicionadoPorUID: adicionouUID,
                _adicionadoPor: adicionou,
                _reportadoPor: email,
                _reportadoPorUID: uid,
                idObjeto: idObjeto,
                motivo: motivo,
                tipo: 'report',
                id: reportDocRef.id
            });

            //retorna OK ao usuário
            return response.status(200).send("OK!");
        });

    }).catch(() => {
        //envia a response como erro (token inválido)
        return response.status(401).send("Unauthorized.");
    });
});