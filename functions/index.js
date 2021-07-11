const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

var serviceAccount = require("./apptrimonio-9844d-firebase-adminsdk-w00sp-4727d2aded.json");
var emailAccount = require("./apptrimonio-email.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const storage = admin.storage();

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


//traduções das mensagens de e-mail (posição da array: 0: INGLÊS, 1 PORTUGUÊS E 2 ESPANHOL)
const assuntosAddAprovado = ["Apptrimônio: o seu objeto foi aprovado!", "Apptrimônio: o seu objeto foi aprovado!", "Apptrimônio: o seu objeto foi aprovado!"];
const assuntosEditAprovada = ["Apptrimônio: a sua edição foi aprovada!", "Apptrimônio: a sua edição foi aprovada!", "Apptrimônio: a sua edição foi aprovada!"];
const assuntosEditDesaprovada = ["Apptrimônio: a sua edição foi reprovada!", "Apptrimônio: a sua edição foi reprovada!", "Apptrimônio: a sua edição foi reprovada!"];
const assuntosReport = ["Apptrimônio: atualização sobre seu reporte.", "Apptrimônio: atualização sobre seu reporte.", "Apptrimônio: atualização sobre seu reporte."];
const assuntosObjRemovido = ["Apptrimônio: o seu objeto foi removido!", "Apptrimônio: o seu objeto foi removido!", "Apptrimônio: o seu objeto foi removido!"];
const assuntosObjEditado = ["Apptrimônio: o seu objeto foi editado!", "Apptrimônio: o seu objeto foi editado!", "Apptrimônio: o seu objeto foi editado!"];
const assuntosRemocaoAprovada = ["Apptrimônio: a sua remoção foi aprovada!", "Apptrimônio: a sua remoção foi aprovada!", "Apptrimônio: a sua remoção foi aprovada!"];
const assuntosVerificacaoEmail = ["Apptrimônio: verificação de e-mail.", "Apptrimônio: verificação de e-mail.", "Apptrimônio: verificação de e-mail."];

const mensagens1 = ["É possível visualizar o QRCode e editar informações do seu objeto dentro do seu perfil no aplicativo!", "É possível visualizar o QRCode e editar informações do seu objeto dentro do seu perfil no aplicativo!", "É possível visualizar o QRCode e editar informações do seu objeto dentro do seu perfil no aplicativo!"];
const mensagens3 = ["Para mais informações, navegue até seus objetos na aba perfil dentro do aplicativo!", "Para mais informações, navegue até seus objetos na aba perfil dentro do aplicativo!", "Para mais informações, navegue até seus objetos na aba perfil dentro do aplicativo!"];
const mensagens4 = ["Obrigado por contribuir com o Apptrimônio!", "Obrigado por contribuir com o Apptrimônio!", "Obrigado por contribuir com o Apptrimônio!"];

const titulosAddAprovado = ["O objeto que você adicionou foi aprovado com sucesso!", "O objeto que você adicionou foi aprovado com sucesso!", "O objeto que você adicionou foi aprovado com sucesso!"];
const titulosAddDesaprovado = ["Infelizmente, o objeto que você adicionou não foi aprovado!", "Infelizmente, o objeto que você adicionou não foi aprovado!", "Infelizmente, o objeto que você adicionou não foi aprovado!"];
const titulosEditAprovada = ["A sua edição foi aprovada!", "A sua edição foi aprovada!", "A sua edição foi aprovada!"];
const titulosEditDesaprovada = ["Infelizmente, a sua edição não foi aprovada!", "Infelizmente, a sua edição não foi aprovada!", "Infelizmente, a sua edição não foi aprovada!"];
const titulosObjRemovido = ["O seu objeto foi removido por um gerenciador!", "O seu objeto foi removido por um gerenciador!", "O seu objeto foi removido por um gerenciador!"];
const titulosObjEditado = ["O seu objeto foi editado por um gerenciador!", "O seu objeto foi editado por um gerenciador!", "O seu objeto foi editado por um gerenciador!"];
const titulosReportRemovido = ["O objeto que você reportou foi removido!", "O objeto que você reportou foi removido!", "O objeto que você reportou foi removido!"];
const titulosReportModificado = ["O objeto que você reportou foi modificado!", "O objeto que você reportou foi modificado!", "O objeto que você reportou foi modificado!"];
const titulosReportDesaprovado = ["O objeto que você reportou não sofreu alterações!", "O objeto que você reportou não sofreu alterações!", "O objeto que você reportou não sofreu alterações!"];
const titulosRemocaoAprovada = ["A remoção do objeto foi aprovada!", "A remoção do objeto foi aprovada!", "A remoção do objeto foi aprovada!"];

const naoInformado = ["Não informado.", "Não informado.", "Não informado."];

//adiciona xp e envia email
async function adicionarXP(dados) {
    const uid = dados.uid;

    const acao = dados.acao;
    const objeto = dados.objeto;
    const quantidade = dados.quantidade;
    const email = dados.email;
    const userEmail = dados.userEmail;
    let lingua = dados.lingua;
    lingua = lingua == "pt" ? 1 : lingua == "es" ? 2 : 0;

    console.log("Adicionado " + quantidade + " xp a " + uid);

    //escanear (adiciona o objeto aos objetos escaneados do usuário)
    //adicionar (adiciona o objeto aos objetos adicionados)
    //verificar (adiciona o objeto aos objetos verificados)
    //remover (envia email ao dono do objeto removido e remove xp)
    //reportar (envia email a quem reportou e adiciona xp)

    const userRef = firestore.collection('usuarios').doc(uid);
    userRef.get().then(doc => {

        if (doc.exists) {

            let escaneados = doc.data()._codigos;
            let adicionados = doc.data()._objetosAdicionados;
            let verificados = doc.data()._objetosVerificados;
            let xp = doc.data().xp + quantidade;
            let receberEmails = doc.data().receberEmails;

            if (receberEmails && (acao == "aprovado" || acao == "remover" || acao == "reportar") || acao == "editar") {
                enviarEmail({ email: userEmail, objeto: objeto, titulo: email.titulo, assunto: email.assunto, mensagem: email.mensagem, lingua: lingua });
            }

            //se for escanear
            if (acao == "escanear") {
                if (!escaneados.includes(objeto.idObjeto)) {
                    escaneados.push(objeto.idObjeto);
                    userRef.update({
                        _codigos: escaneados,
                        xp: xp
                    });
                }
            } else if (acao == "adicionar") {
                //caso não já não tenha o objeto na lista
                let possui = false;
                for (i in adicionados) {
                    if (adicionados[i].id == objeto.idObjeto) {
                        possui = true;
                    }
                }

                //caso não tenha na lista adiciona e adiciona xp
                if (!possui) {
                    adicionados.push({ id: objeto.idObjeto, nome: objeto.nome });
                    userRef.update({
                        xp: xp,
                        _objetosAdicionados: adicionados
                    });
                }
            } else if (acao == "verificar") {

                //caso não já não tenha o objeto na lista
                let possui = false;
                for (i in verificados) {
                    if (verificados[i].idAndamento == objeto.idAndamento) {
                        possui = true;
                    }
                }

                if (!possui) {
                    verificados.push({ id: objeto.idObjeto, idAndamento: objeto.idAndamento });
                    userRef.update({
                        _objetosVerificados: verificados,
                        xp: xp
                    });
                }
            } else {
                userRef.update({
                    xp: xp
                });
            }
        }
    });
}

async function enviarConfirmacao(dados) {
    const email = dados.email;
    const lingua = dados.lingua;

    try {
        const link = await admin.auth().generateEmailVerificationLink(email);

        const assunto = assuntosVerificacaoEmail[lingua];
        //pega o template do banco de dados
        let emailTemplateDoc = await firestore.collection('templateEmails').doc('confirmacao').get();
        if (!emailTemplateDoc.exists) { return null; }

        let dadosEmail = emailTemplateDoc.data();
        let template = dadosEmail.EN;

        if (lingua == 1) { template = dadosEmail.PT } else if (lingua == 2) { template = dadosEmail.ES }

        //define as variaveis do objeto que serão enviadas
        const variaveis = {
            LINK: link
        };

        //replace nos placeholders
        const emailFinal = template.replace(/{\w+}/g, placeholder =>
            variaveis[placeholder.substring(1, placeholder.length - 1)] || placeholder);
        //envia o e-mail
        try {

            const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailAccount.email,
                    pass: emailAccount.pass
                }
            });

            const mailOptions = {
                from: 'Apptrimônio <apptrimonio@gmail.com>',
                to: email,
                subject: assunto,
                html: emailFinal
            };

            console.log("Enviando e-mail de confirmação para " + email);

            const result = await transport.sendMail(mailOptions);
            return result;
        } catch (error) {
            console.log("Erro ao enviar email para " + email + ": " + error);
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
    const emailUser = await admin.auth().getUserByEmail(email).then(user => {
        return firestore.collection('usuarios').doc(user.uid).get().then(doc => {
            if (doc.exists) {
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
        IMAGEM: objeto.imagem == "" ? "https://v0.static.betalabs.com.br/ecommerce/maxibanho/img/unavailable-m.jpg" : objeto.imagem,
        NOME: objeto.nome == "" ? naoInformado[lingua] : objeto.nome,
        VALOR: objeto.valor == 0 ? naoInformado[lingua] : objeto.valor,
        CATEGORIA: objeto.categoria == "" ? naoInformado[lingua] : objeto.categoria,
        COMPRA: objeto.compra == "" ? naoInformado[lingua] : new Date(objeto.compra),
        LOCAL: objeto.local == "" ? naoInformado[lingua] : objeto.local,
        VALORSENTIMENTAL: objeto.valorSentimental == "" ? naoInformado[lingua] : objeto.valorSentimental,
        DESCRICAOIMAGEM: objeto.descricaoImagem == "" ? naoInformado[lingua] : objeto.descricaoImagem,
        TITULO: titulo,
        DESCRICAO: objeto.descricao == "" ? naoInformado[lingua] : objeto.descricao,
        MENSAGEM: mensagem
    };

    //replace nos placeholders
    const emailFinal = template.replace(/{\w+}/g, placeholder =>
        variaveis[placeholder.substring(1, placeholder.length - 1)] || placeholder);

    //envia o e-mail
    try {
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailAccount.email,
                pass: emailAccount.pass
            }
        });

        const mailOptions = {
            from: 'Apptrimônio <apptrimonio@gmail.com>',
            to: email,
            subject: assunto,
            html: emailFinal
        };

        console.log("Enviando e-mail para " + email);

        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.log("Erro ao enviar e-mail para " + email);
        return error;
    }
}

//envia o e-mail de confirmação do apptrimônio
exports.enviarEmailConfirmacao = functions.https.onRequest((request, response) => { //quando o usuário deseja confirmar o e-mail

    // dados do usuário
    const token = request.body.token;
    let lingua = request.body.lingua;

    //verifica se tem as variáveis necessárias
    if (lingua == null || token == undefined || lingua == "" || token == "") {
        console.log("Bad request. Lingua ou token inválido.");
        return response.status(400).send("Bad request.");
    }

    lingua = lingua == "pt" ? 1 : lingua == "es" ? 2 : 0;

    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const email = decodedToken.email;

        enviarConfirmacao({ email: email, lingua: lingua });
        return response.status(200).send("OK!");

    }).catch(() => { //caso não for um token válido (não for um usuário)
        console.log("Unauthorized. Token inválido.");
        return response.status(401).send("Unauthorized.");
    });
});

//define se quer ou não quer receber e-mails do apptrimonio
exports.receberEmails = functions.https.onRequest((request, response) => { //função chamada ao ativar ou desativar o recebimento de emails

    //váriaveis recebidas do usuário
    const token = request.body.token; //token do usuário
    let status = (request.body.status === 'true'); //TRUE caso quiser receber e-mails e FALSE caso não quiser

    return admin.auth().verifyIdToken(token).then(decodedToken => {

        const uid = decodedToken.uid;
        const userRef = firestore.collection('usuarios').doc(uid);

        userRef.update({ receberEmails: status });

        return response.status(200).send({ status: status });

    }).catch(() => {
        console.log("Unauthorized. Token inválido.");
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });
});

//ao entrar no aplicativo ou fazer login, recebe os dados do banco de dados do usuário
exports.verificarConta = functions.https.onRequest((request, response) => { //função para verificar se o usuário é gerenciador ou não

    const token = request.body.token; //recebe o token do usuário
    let lingua = request.body.lingua;
    lingua = lingua == "pt" ? 1 : lingua == "es" ? 2 : 0;

    let resposta = { //resposta que será enviada ao cliente
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
        const emailVerificado = admin.auth().getUser(uid).then((userRecord => { return userRecord.emailVerified; })).catch(() => { return false; });
        const email = decodedToken.email;

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
                    email: email,
                    receberEmails: true
                });

                //envia o e-mail de confirmação após criar o usuário caso não estiver verificado
                if (!emailVerificado) {
                    enviarConfirmacao({ email: email, lingua: lingua });
                }
            }
            return response.status(200).send(resposta);
        });
    }).catch(() => { //caso não for um token válido (não for um usuário)
        console.log("Unauthorized. Token inválido.");
        return response.status(401).send("Unauthorized."); //envia a response como objeto padrão (sem gerenciador, xp e badges)
    });
});

//ao escanear um qrcode (ganha xp) ou ao pesquisar pelo objeto (não ganha xp)
exports.requisitarObjeto = functions.https.onRequest((request, response) => { //função para verificar se o objeto requisitado existe e retornar ao usuário

    const idObjeto = request.body.idObjeto.trim(); //id do objeto que o usuário envia
    const token = request.body.token; //recebe o token do usuário caso existir

    if (idObjeto == undefined || idObjeto == "") { //verifica se o id realmente tem algo
        console.log("Bad request. idObjeto inválido.");
        return response.status(400).send({ status: "Bad request." });
    }

    return firestore.collection('objetos').doc(idObjeto).get().then(doc => { //pega o documento do banco de dados

        if (doc.exists) { //caso o objeto exista no banco de dados

            const data = doc.data(); //pega os dados do documento

            //verifica se o objeto foi aprovado
            const desaprovado = {
                status: data._aprovacao,
                motivo: data._status
            };

            if (data._aprovacao == "desaprovado" || data._aprovacao == "andamento" || data._aprovacao == "excluido") {
                console.log("Objeto desaprovado, em andamento ou excluído.");
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
                valorSentimental: data.valorSentimental,
                idObjeto: idObjeto
            };

            //caso estiver um usuário logado adiciona o objeto aos objetos escaneados e adiciona xp
            if (token != undefined && token != "") {
                admin.auth().verifyIdToken(token).then(decodedToken => {
                    const uid = decodedToken.uid;
                    adicionarXP({ uid: uid, acao: "escanear", objeto: objeto, quantidade: xpAoEscanear });
                });
            }

            //retorna o objeto
            return response.status(200).send(objeto);

        } else { //caso o objeto não exista no banco de dados
            console.log("Object not found! O objeto não foi encontrado.");
            return response.status(404).send({ status: "Object not found!" });
        }
    });
});

//ao tentar adicionar um objeto
exports.adicionarObjeto = functions.https.onRequest((request, response) => { //função para adicionar um objeto

    //variaveis recebidas
    const nome = request.body.nome;
    const categoria = request.body.categoria;
    let dataCompra = request.body.dataCompra;
    const valor = request.body.valor;
    const local = request.body.local;
    const descricaoImagem = request.body.descricaoImagem;
    const valorSentimental = request.body.valorSentimental;
    let lingua = request.body.lingua;
    const descricao = request.body.descricao;

    const imagem = request.body.imagem;
    const token = request.body.token;

    if (nome == undefined || nome == "" || categoria == undefined || categoria == "" || valor == undefined || valor == "" || imagem == undefined || imagem == "" || local == undefined || local == "" || descricaoImagem == undefined || descricaoImagem == "" || lingua == undefined || lingua == "") {
        console.log("Bad request. Um dos campos necessários para adicionar o objeto é inválido.");
        return response.status(400).send("Bad request."); //caso faltar algum campo
    }

    dataCompra = dataCompra == "0" || dataCompra == undefined ? "" : new Date(Number(dataCompra));

    //verifica se o token do usuário é válido
    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const emailVerificado = admin.auth().getUser(uid).then((userRecord => { return userRecord.emailVerified; })).catch(() => { return false; });

        //verifica se o usuário possui permissão pra adicionar objeto
        return firestore.collection('usuarios').doc(uid).get().then(async(doc) => {

            if (!doc.exists) { //caso não existir o arquivo
                console.log("Unauthorized. O usuário não está presente no banco de dados.");
                return response.status(401).send("Unauthorized.");
            }

            if (!emailVerificado) {
                console.log("Email not verified. O e-mail do usuário não está verificado.");
                return response.status(401).send("Email not verified.");
            } //verifica se o email está verificado

            const xp = doc.data().xp;

            if (xp < xpAdicionar) { //caso não possuir permissão
                console.log("Unauthorized. O usuário não possui xp suficiente.");
                return response.status(401).send("Unauthorized.");
            }

            const refObjeto = firestore.collection('objetos').doc();
            const bucket = storage.bucket("apptrimonio-9844d.appspot.com");
            const imageId = crypto.randomBytes(10).toString("base64").replace("/", "*");
            const file = bucket.file(refObjeto.id + "-" + imageId + ".jpg");
            const buffer = new Uint8Array(Buffer.from(imagem, "base64"));
            const options = { resumable: false, metadata: { contentType: "image/jpg" } };

            const url = await file.save(buffer, options).then(() => {
                return file.getSignedUrl({ action: "read", expires: '03-09-2500' });
            }).then(urls => {
                const url2 = urls[0];
                console.log("URL: " + url2);
                return url2;
            }).catch(error => {
                console.log("Erro: " + error);
                console.log("Upload error. Ocorreu um erro ao fazer upload do arquivo.");
                return "";
            });

            let objeto = {
                _adicionadoPor: email,
                _adicionadoPorUID: uid,
                _aprovacao: "andamento",
                _aprovadoPor: null,
                _aprovadoPorUID: null,
                _aprovadoEm: null,
                _editores: [],
                nome: nome,
                _imagem: url,
                _lingua: lingua,
                categoria: categoria,
                compra: dataCompra,
                descricaoImagem: descricaoImagem,
                descricao: descricao,
                local: local,
                valor: valor,
                valorSentimental: valorSentimental
            };

            let objeto2 = Object.assign({}, objeto);
            objeto2.idObjeto = refObjeto.id;
            objeto2.imagem = url;

            let resposta = {
                idObjeto: refObjeto.id,
                aprovacao: "andamento"
            };

            //caso for gerenciador (não precisa de aprovação de gerenciador)
            if (xp >= xpGerenciador) {
                objeto._aprovacao = "aprovado";
                objeto._aprovadoPor = email;
                objeto._aprovadoPorUID = uid;
                objeto._aprovadoEm = admin.firestore.FieldValue.serverTimestamp();

                resposta.aprovacao = "aprovado";
                resposta.imagem = url;

                //adiciona o objeto aos objetos adicionados e adiciona xp
                lingua = lingua == "pt" ? 1 : lingua == "es" ? 2 : 0;
                adicionarXP({ uid: uid, acao: "aprovado", objeto: objeto2, email: { titulo: titulosAddAprovado[lingua], assunto: assuntosAddAprovado[lingua], mensagem: mensagens1[lingua] }, userEmail: email, lingua: lingua, quantidade: xpAoAdicionar });
            } else { //caso não for gerenciador (precisa de aprovação de gerenciador)

                //adicionar objeto em andamento no banco de dados "andamento"
                const refAndamento = firestore.collection('andamento').doc();
                objeto2.idAndamento = refAndamento.id;
                objeto2.tipo = "add";

                refAndamento.create(objeto2);
            }

            //adiciona o objeto ao usuario
            adicionarXP({ uid: uid, acao: "adicionar", objeto: objeto2, userEmail: email, lingua: lingua, quantidade: 0 });

            //adiciona o objeto ao banco de dados e retorna o id dele
            return refObjeto.create(objeto).then(() => {
                return response.status(200).send(resposta);
            }).catch(error => {
                console.log(error);
                console.log("An error occurred! Ocorreu um erro desconhecido ao criar o objeto.");
                return response.status(500).send("An error occurred!");
            });

        });

    }).catch(() => {
        console.log("Unauthorized. O token é inválido.");
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });

});

//ao tentar editar um objeto
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

    compra = compra == "0" || compra == undefined ? "" : new Date(Number(compra));


    //caso o token ou o id do objeto não foi enviado
    if (token == undefined || idObjeto == undefined || token == "" || idObjeto == "") { return response.status(400).send("Bad request.") }

    //verifica se o token do usuário é válido
    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const emailVerificado = admin.auth().getUser(uid).then((userRecord => { return userRecord.emailVerified; })).catch(() => { return false; });
        const userRef = firestore.collection('usuarios').doc(uid);
        const andamentoRef = firestore.collection('andamento').doc();
        const objetoRef = firestore.collection('objetos').doc(idObjeto);

        if (!emailVerificado) {
            console.log("Email not verified. O e-mail do usuário não está verificado.");
            return response.status(401).send("Email not verified.");
        } //verifica se o email está verificado

        //pega o xp do usuário
        return userRef.get().then(async(userDoc) => {

            //caso não existir o arquivo do usuário
            if (!userDoc.exists) {
                console.log("Unauthorized. Não há dados do usuário no banco de dados.");
                return response.status(401).send("Unauthorized.");
            }

            const xp = userDoc.data().xp;

            //caso não possuir permissão para editar um objeto
            if (xp < xpEditar) {
                console.log("Unauthorized. O usuário não possui xp necessário para fazer a edição.");
                return response.status(401).send("Unauthorized.");
            }

            //caso possuir imagem faz upload
            if (imagem != undefined && imagem != "") {
                const bucket = storage.bucket("apptrimonio-9844d.appspot.com");
                const imageId = crypto.randomBytes(10).toString("base64").replace("/", "*");;
                const file = bucket.file(objetoRef.id + "-" + imageId + ".jpg");
                const buffer = new Uint8Array(Buffer.from(imagem, "base64"));
                const options = { resumable: false, metadata: { contentType: "image/jpg" } };

                imagem = await file.save(buffer, options).then(() => {
                    return file.getSignedUrl({ action: "read", expires: '03-09-2500' });
                }).then(urls => {
                    const url = urls[0];
                    console.log("URL: " + url);
                    return url;
                }).catch(error => {
                    console.log(error);
                    console.log("Erro ao fazer upload da imagem.");
                    return "";
                });
            }

            let resposta = {
                status: "andamento"
            };

            return objetoRef.get().then(objetoDoc => {

                //caso não existir o objeto
                if (!objetoDoc.exists) {
                    console.log("Object not found! O objeto não foi encontrado no banco de dados!");
                    return response.status(404).send("Object not found!");
                }

                const dadosObjeto = objetoDoc.data();
                const criadoPor = dadosObjeto._adicionadoPor;
                const criadoPorUID = dadosObjeto._adicionadoPorUID;

                //caso não possuir permissão de gerenciador adiciona em andamento
                if (xp < xpGerenciador) {
                    andamentoRef.create({
                        _editadoPor: email,
                        _editadoPorUID: uid,
                        _adicionadoPor: criadoPor,
                        _adicionadoPorUID: criadoPorUID,
                        _lingua: lingua,
                        editCategoria: categoria,
                        editCompra: compra,
                        editDescricaoImagem: descricaoImagem,
                        editImagem: imagem,
                        editLocal: local,
                        editNome: nome,
                        editValor: valor,
                        editDescricao: descricao,
                        editValorSentimental: valorSentimental,
                        idObjeto: idObjeto,
                        idAndamento: andamentoRef.id,
                        tipo: 'edit'
                    });

                    return response.status(200).send(resposta);
                } else {
                    //caso possuir gerenciador obtém os dados do objeto
                    resposta.status = "aprovado";
                    resposta.imagem = imagem;

                    //define a lingua do objeto
                    let lingua = dadosObjeto._lingua;

                    let editores = dadosObjeto._editores;
                    editores.push(email);
                    imagem = imagem != undefined && imagem != "" ? imagem : dadosObjeto._imagem;
                    categoria = categoria != undefined && categoria != "" ? categoria : dadosObjeto.categoria;
                    descricaoImagem = descricaoImagem != undefined && descricaoImagem != "" ? descricaoImagem : dadosObjeto.descricaoImagem;
                    local = local != undefined && local != "" ? local : dadosObjeto.local;
                    nome = nome != undefined && nome != "" ? nome : dadosObjeto.nome;
                    compra = compra != undefined && compra != "0" ? compra : dadosObjeto.compra;
                    valor = valor != undefined && valor != "" ? valor : dadosObjeto.valor;
                    valorSentimental = valorSentimental != undefined && valorSentimental != "" ? valorSentimental : dadosObjeto.valorSentimental;
                    descricao = descricao != undefined && descricao != "" ? descricao : dadosObjeto.descricao;

                    let objeto2 = Object.assign({}, objetoDoc.data());
                    objeto2.imagem = imagem;
                    objeto2.categoria = categoria;
                    objeto2.compra = compra;
                    objeto2.descricaoImagem = descricaoImagem;
                    objeto2.local = local;
                    objeto2.nome = nome;
                    objeto2.descricao = descricao;
                    objeto2.valor = valor;
                    objeto2.valorSentimental = valorSentimental;

                    //seta os valores no objeto
                    objetoRef.set({
                        _editores: editores,
                        _imagem: imagem,
                        categoria: categoria,
                        compra: compra,
                        descricaoImagem: descricaoImagem,
                        local: local,
                        nome: nome,
                        descricao: descricao,
                        valor: valor,
                        valorSentimental: valorSentimental,
                        _lingua: lingua
                    }, { merge: true });

                    lingua = lingua == "pt" ? 1 : lingua == "es" ? 2 : 0;

                    //envia e-mail a quem editou
                    adicionarXP({ uid: uid, acao: "editar", objeto: objeto2, email: { titulo: titulosEditAprovada[lingua], assunto: assuntosEditAprovada[lingua], mensagem: mensagens4[lingua] }, userEmail: email, lingua: objeto2.lingua, quantidade: xpAoEditar });
                    //envia e-mail a quem criou
                    adicionarXP({ uid: criadoPorUID, acao: "editar", objeto: objeto2, email: { titulo: titulosObjEditado[lingua], assunto: assuntosObjEditado[lingua], mensagem: mensagens3[lingua] }, userEmail: criadoPor, lingua: objeto2.lingua, quantidade: 0 });

                    return response.status(200).send(resposta);
                }
            });
        });
    }).catch(error => {
        console.log("Unauthorized. O token é inválido.");
        console.log(error);
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });
});

exports.removerObjeto = functions.https.onRequest((request, response) => { //função para remover um objeto

    const idAndamento = request.body.idAndamento;
    const idObjeto = request.body.idObjeto; //recebe o id do objeto a ser excluido
    const token = request.body.token; //recebe o token do usuário que quer remover o objeto
    const motivo = request.body.motivo; //recebe o motivo da remoção do objeto

    if (idObjeto == undefined || token == undefined || motivo == undefined || idObjeto == "" || token == "" || motivo == "") {
        console.log("Bad request. idObjeto, token ou motivo é inválido");
        return response.status(404).send("Bad request.");
    } //caso o usuário não enviou um dos parametros

    return admin.auth().verifyIdToken(token).then((decodedToken) => {

        const uid = decodedToken.uid; //uid do usuário
        const email = decodedToken.email;
        const emailVerificado = admin.auth().getUser(uid).then((userRecord => { return userRecord.emailVerified; })).catch(() => { return false; });

        if (!emailVerificado) {
            console.log("Email not verified. O e-mail do usuário não é verificado.");
            return response.status(401).send("Email not verified.");
        } //verifica se o email está verificado

        const refUser = firestore.collection('usuarios').doc(uid);
        const refObjeto = firestore.collection('objetos').doc(idObjeto);

        //pega o objeto do banco de dados
        return refObjeto.get().then(doc => {

            if (!doc.exists) { //caso o objeto não exista
                console.log("Object not found. O objeto não foi encontrado no banco de dados.");
                return response.status(404).send("Object not found!");
            }

            const dataObj = doc.data();
            let lingua = dataObj._lingua;
            const adicionadoPor = dataObj._adicionadoPor;
            const adicionadoPorUID = dataObj._adicionadoPorUID;
            let objeto2 = Object.assign({}, dataObj);;
            objeto2.imagem = dataObj._imagem;
            objeto2.idObjeto = refObjeto.id;
            if (lingua == "pt") { lingua = 1; } else if (lingua == "es") { lingua = 2; } else { lingua = 0; }

            const editores = dataObj._editores;
            editores.push(email);

            //verifica se o usuário possui XP suficiente para ser gerenciador
            return refUser.get().then(docUser => {
                if (!docUser.exists) {
                    console.log("Unauthorized. O usuário não está no banco de dados.");
                    return response.status(401).send("Unauthorized.");
                }

                const xp = docUser.data().xp;

                if (xp < xpGerenciador && uid != dataObj._adicionadoPorUID) {
                    console.log("Unauthorized. O usuário não possui xp necessário para se tornar gerenciador ou então não é o criador do objeto.");
                    return response.status(401).send("Unauthorized.");
                } //caso não for o criador do objeto ou gerenciador

                //exclui o objeto
                refObjeto.set({
                    _aprovacao: 'excluido',
                    _status: motivo,
                    _excluidoEm: admin.firestore.FieldValue.serverTimestamp(),
                    _excluidoPor: email,
                    _excluidoPorUID: uid
                }, { merge: true });

                //caso a exclusão for proveniente de um report (remove o objeto em andamento, adiciona xp a quem reportou e remove de quem adicionou e envia email)
                if (idAndamento != undefined) {

                    //pega o objeto em andamento do banco de dados
                    const refAndamento = firestore.collection('andamento').doc(idAndamento);
                    refAndamento.get().then(docAndamento => {

                        if (docAndamento.exists) {
                            const dataAndamento = docAndamento.data();
                            const tipo = dataAndamento.tipo;
                            const quemReportou = dataAndamento._reportadoPor;
                            const quemReportouUID = dataAndamento._reportadoPorUID;

                            if (tipo == "report") { //caso for report

                                //remove o objeto
                                refAndamento.delete();

                                //adiciona xp a quem reportou, ao gerenciador
                                adicionarXP({ uid: quemReportouUID, acao: "reportar", objeto: objeto2, email: { titulo: titulosReportRemovido[lingua], assunto: assuntosReport[lingua], mensagem: mensagens4[lingua] }, userEmail: quemReportou, lingua: dataObj.lingua, quantidade: xpAoReportar });
                                adicionarXP({ uid: uid, acao: "verificar", email: { titulo: titulosRemocaoAprovada[lingua], assunto: assuntosRemocaoAprovada[lingua], mensagem: mensagens4[lingua] }, objeto: objeto2, userEmail: email, lingua: dataObj.lingua, quantidade: xpAoAprovar });
                            }
                        }
                    });
                }

                //remove xp do criador
                adicionarXP({ uid: adicionadoPorUID, acao: "remover", objeto: objeto2, email: { titulo: titulosObjRemovido[lingua], assunto: assuntosObjRemovido[lingua], mensagem: mensagens3[lingua] }, userEmail: adicionadoPor, lingua: dataObj.lingua, quantidade: -xpAoAdicionar });


                return response.status(200).send("OK!");
            });

        });
    }).catch((error) => {
        console.log(error);
        console.log("Unauthorized. O token é inválido.");
        return response.status(401).send("Unauthorized."); //envia a response como erro (token inválido)
    });
});

exports.objetosAndamento = functions.https.onRequest((request, response) => { //função para receber todos os objetos que precisam ser aprovados

    //recebe token do usuário
    const token = request.body.token;
    if (token == undefined || token == "") {
        console.log("Bad request. O token é inválido.");
        return response.status(404).send("Bad request.");
    } //caso o usuário não enviou um dos parametros

    const andamentoRef = firestore.collection('andamento');

    //verifica se o token é válido
    return admin.auth().verifyIdToken(token).then(decodedToken => {

        const uid = decodedToken.uid;
        const emailVerificado = admin.auth().getUser(uid).then((userRecord => { return userRecord.emailVerified; })).catch(() => { return false; });

        if (!emailVerificado) {
            console.log("Email not verified. O e-mail do usuário não está verificado.");
            return response.status(401).send("Email not verified.");
        } //verifica se o email está verificado

        //verifica se o usuário possui permissão de gerenciador
        return firestore.collection('usuarios').doc(uid).get().then(docUser => {
            if (!docUser.exists) {
                console.log("Unauthorized. O usuário não está no banco de dados.");
                return response.status(401).send("Unauthorized.");
            }

            const xp = docUser.data().xp;
            if (xp < xpGerenciador) {
                console.log("Unauthorized. O usuário não possui xp necessário para se tornar gerenciador.");
                return response.status(401).send("Unauthorized.");
            }

            //pega os objetos em andamento
            return andamentoRef.get().then(docs => {

                //verifica se há objetos
                if (docs.size == 0) {
                    console.log("There are no objects avaiable. Não há objetos em andamento no momento.");
                    return response.status(200).send("There are no objects available.")
                }

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
        console.log("Unauthorized. O token é inválido.");
        return response.status(401).send("Unauthorized.");
    });

});

exports.aprovacaoObjeto = functions.https.onRequest(async(request, response) => { //função para aprovar ou desaprovar um objeto
    const token = request.body.token;
    const idAndamento = request.body.idAndamento;
    const motivo = request.body.token;
    const valoresAprovar = request.body.valoresAprovar == "" || request.body.valoresAprovar == undefined ? '{}' : JSON.parse(request.body.valoresAprovar); //valores recebidos caso o objeto tenha valores diferentes do original 
    const status = (request.body.status === 'true'); //valor TRUE para objeto APROVADO e FALSE para DESAPROVADO
    console.log(status ? "Aprovando objeto " + idAndamento + "..." : "Desaprovando objeto " + idAndamento + "...");

    const reportRef = firestore.collection('andamento').doc(idAndamento);

    //caso o usuário não enviou token, status, o id andamento ou então o motivo (caso for desaprovado)

    if (idAndamento == undefined || status == undefined || idAndamento == "" || token == "" || (status != true && status != false) || token == undefined || (motivo == "" && !status)) {
        console.log("Bad request. Um dos campos é inválido.");
        return response.status(400).send("Bad request.");
    }
    //verifica se o token é válido
    return admin.auth().verifyIdToken(token).then(decodedToken => {

        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const emailVerificado = admin.auth().getUser(uid).then((userRecord => { return userRecord.emailVerified; })).catch(() => { return false; });

        //verifica se o usuário é gerenciador
        return firestore.collection('usuarios').doc(uid).get().then(docUser => {
            if (!docUser.exists || docUser.data().xp < xpGerenciador) {
                console.log("Unauthorized. O usuário não existe no banco de dados ou então não possui xp necessário para se tornar gerenciador");
                return response.status(401).send("Unauthorized.");
            }

            if (!emailVerificado) {
                console.log("Email not verified. O e-mail do usuário não está verificado.");
                return response.status(400).send("Email not verified.");
            }

            //pega o objeto em andamento do banco de dados
            return reportRef.get().then(docAndamento => {
                if (!docAndamento.exists) {
                    console.log("Object not found. O objeto em andamento não foi encontrado.");
                    return response.status(404).send("Object not found!");
                } //caso o id do objeto em andamento não exista

                const dadosObjetoAndamento = docAndamento.data();
                const tipoObjetoAndamento = dadosObjetoAndamento.tipo;
                const idObjetoAndamento = dadosObjetoAndamento.idObjeto;
                const refObjeto = firestore.collection('objetos').doc(idObjetoAndamento);

                return refObjeto.get().then(async(docObjeto) => {

                    //verifica se o objeto existe
                    if (!docAndamento.exists) {
                        //caso não existir deleta o objeto em andamento e retorna erro
                        reportRef.delete();
                        console.log("Object not found. O objeto original não foi encontrado.");
                        return response.status(404).send("Object not found!");
                    }

                    const dataObjeto = docObjeto.data();
                    let lingua = dataObjeto._lingua;
                    lingua = lingua == "pt" ? 1 : lingua == "es" ? 2 : 0;

                    //verifica se o objeto foi excluído (exclui o objeto em andamento e retorna erro)
                    if (dataObjeto._aprovacao == "excluido") {
                        console.log("The object has been deleted. O objeto foi excluído.");
                        return response.status(404).send("The object has been deleted.");
                    }

                    //caso possuir imagem faz upload
                    if (valoresAprovar.imagem != undefined && valoresAprovar.imagem != "") {
                        const bucket = storage.bucket("apptrimonio-9844d.appspot.com");
                        const imageId = crypto.randomBytes(10).toString("base64").replace("/", "*");
                        const file = bucket.file(refObjeto.id + "-" + imageId + ".jpg");
                        const buffer = new Uint8Array(Buffer.from(valoresAprovar.imagem, "base64"));
                        const options = { resumable: false, metadata: { contentType: "image/jpg" } };

                        valoresAprovar.imagem = await file.save(buffer, options).then(() => {
                            return file.getSignedUrl({ action: "read", expires: '03-09-2500' });
                        }).then(urls => {
                            const url = urls[0];
                            console.log("URL: " + url);
                            return url;
                        }).catch(error => {
                            console.log(error);
                            console.log("Ocorreu um erro ao fazer upload da imagem.");
                            return "";
                        })
                    }

                    //dados do objeto que podem ser editados caso necessário
                    const uidAdicionou = dataObjeto._adicionadoPorUID;
                    const emailAdicionou = dataObjeto._adicionadoPor;
                    const editores = dataObjeto._editores;
                    editores.push(email); //adiciona o usuário aos editores
                    const imagem = valoresAprovar.imagem == undefined || valoresAprovar.imagem == "" ? dataObjeto._imagem : valoresAprovar.imagem;
                    const categoria = valoresAprovar.categoria == undefined || valoresAprovar.categoria == "" ? dataObjeto.categoria : valoresAprovar.categoria;
                    const compra = valoresAprovar.compra == undefined || valoresAprovar.compra == 0 ? dataObjeto.compra : new Date(Number(valoresAprovar.compra));
                    const descricaoImagem = valoresAprovar.descricaoImagem == undefined || valoresAprovar.descricaoImagem == "" ? dataObjeto.descricaoImagem : valoresAprovar.descricaoImagem;
                    const local = valoresAprovar.local == undefined || valoresAprovar.local == "" ? dataObjeto.local : valoresAprovar.local;
                    const nome = valoresAprovar.nome == undefined || valoresAprovar.nome == "" ? dataObjeto.nome : valoresAprovar.nome;
                    console.log("valor " + valoresAprovar.valor);
                    const valor = valoresAprovar.valor == undefined || valoresAprovar.valor == 0 ? dataObjeto.valor : valoresAprovar.valor;
                    const valorSentimental = valoresAprovar.valorSentimental == undefined || valoresAprovar.valorSentimental == "" ? dataObjeto.valorSentimental : valoresAprovar.valorSentimental;
                    const descricao = valoresAprovar.descricao == undefined || valoresAprovar.descricao == "" ? dataObjeto.descricao : valoresAprovar.descricao;

                    //caso for andamento de objeto adicionado (foi adicionado por um usuário sem gerenciador)

                    let objeto2 = Object.assign({}, dataObjeto);
                    objeto2.imagem = docObjeto.data()._imagem;
                    objeto2.idObjeto = refObjeto.id;
                    objeto2.idAndamento = idObjetoAndamento;
                    //adiciona xp ao gerenciador
                    adicionarXP({ uid: uid, acao: "verificar", objeto: objeto2, userEmail: email, lingua: objeto2.lingua, quantidade: xpAoAprovar });

                    if (tipoObjetoAndamento == "add") {

                        //remove o objeto em andamento
                        reportRef.delete();

                        //aprova ou desaprova o objeto
                        if (status) {
                            refObjeto.set({
                                _aprovacao: "aprovado",
                                _aprovadoEm: admin.firestore.FieldValue.serverTimestamp(),
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
                            }, { merge: true });

                            //envia e-mail a quem criou (add aprovado)
                            adicionarXP({ uid: uidAdicionou, acao: "aprovado", objeto: objeto2, email: { titulo: titulosAddAprovado[lingua], assunto: assuntosAddAprovado[lingua], mensagem: mensagens1[lingua] }, userEmail: emailAdicionou, lingua: objeto2.lingua, quantidade: xpAoAdicionar });
                        } else {
                            refObjeto.set({
                                _aprovacao: "desaprovado",
                                _aprovadoEm: admin.firestore.FieldValue.serverTimestamp(),
                                _aprovadoPor: email,
                                _aprovadoPorUID: uid,
                                _editores: editores,
                                status: motivo,
                            }, { merge: true });

                            //envia e-mail a quem criou (add desaprovado)
                            adicionarXP({ uid: uidAdicionou, acao: "aprovado", objeto: objeto2, email: { titulo: titulosAddDesaprovado[lingua], assunto: titulosAddDesaprovado[lingua], mensagem: mensagens3[lingua] }, userEmail: emailAdicionou, lingua: objeto2.lingua, quantidade: -xpAoAdicionarF });
                        }

                        //retorna ok
                        return response.status(200).send("OK!");
                    } else if (tipoObjetoAndamento == "report") { //caso for report (algum usuário reportou)
                        const quemReportouUID = docAndamento.data()._reportadoPorUID;
                        const quemReportou = docAndamento.data()._reportadoPor;

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
                            }, { merge: true });

                            //envia e-mail a quem reportou e a quem adicionou e foi modificado
                            adicionarXP({ uid: uidAdicionou, acao: "reportar", objeto: objeto2, email: { titulo: titulosObjEditado[lingua], assunto: assuntosObjEditado[lingua], mensagem: mensagens3[lingua] }, userEmail: emailAdicionou, lingua: objeto2.lingua, quantidade: 0 });
                            adicionarXP({ uid: quemReportouUID, acao: "reportar", objeto: objeto2, email: { titulo: titulosReportModificado[lingua], assunto: assuntosReport[lingua], mensagem: mensagens4[lingua] }, userEmail: quemReportou, lingua: objeto2.lingua, quantidade: xpAoReportar });
                        } else {
                            //envia e-mail a quem reportou e não foi modificado
                            adicionarXP({ uid: quemReportouUID, acao: "reportar", objeto: objeto2, email: { titulo: titulosReportDesaprovado[lingua], assunto: assuntosReport[lingua], mensagem: mensagens4[lingua] }, userEmail: quemReportou, lingua: objeto2.lingua, quantidade: 0 });
                        }

                        //retorna ok
                        return response.status(200).send("OK!");
                    } else if (tipoObjetoAndamento == "edit") { //caso o objeto em andamento for edit (um usuário sem gerenciador editou)
                        const quemEditou = docAndamento.data()._editadoPor;
                        const quemEditouUID = docAndamento.data()._editadoPorUID;

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
                            }, { merge: true });

                            //envia e-mail a quem editou e foi aprovado e a quem adicionou
                            adicionarXP({ uid: quemEditouUID, acao: "editar", objeto: objeto2, email: { titulo: titulosEditAprovada[lingua], assunto: assuntosEditAprovada[lingua], mensagem: mensagens4[lingua] }, userEmail: quemEditou, lingua: objeto2.lingua, quantidade: xpAoEditar });
                            adicionarXP({ uid: uidAdicionou, acao: "aprovado", objeto: objeto2, email: { titulo: titulosObjEditado[lingua], assunto: assuntosObjEditado[lingua], mensagem: mensagens3[lingua] }, userEmail: emailAdicionou, lingua: objeto2.lingua, quantidade: 0 });
                        } else {

                            //envia e-mail a quem editou e e não foi aprovado
                            adicionarXP({ uid: quemEditouUID, acao: "editar", objeto: objeto2, email: { titulo: titulosEditDesaprovada[lingua], assunto: assuntosEditDesaprovada[lingua], mensagem: mensagens4[lingua] }, userEmail: quemEditou, lingua: objeto2.lingua, quantidade: -xpAoEditarF });
                        }

                        //retorna ok
                        return response.status(200).send("OK!");
                    }

                    //caso não retornar valor dos IFs é por que tem algo errado
                    console.log("Ocorreu um erro inesperado.");
                    return response.status(500).send("An error occured!");
                });
            });
        });

    }).catch(error => {
        //envia a response como erro (token inválido)
        console.log("Unauthorized. O token é inválido.");
        console.log(error);
        return response.status(401).send("Unauthorized.");
    });
});

exports.reportarObjeto = functions.https.onRequest((request, response) => { //função pra reportar um objeto

    //valores enviados pelo usuário
    const token = request.body.token;
    const idObjeto = request.body.idObjeto;
    const motivo = request.body.motivo;

    //caso o usuário não enviar o token, o id do objeto e o motivo do report
    if (token == undefined || idObjeto == undefined || motivo == undefined) {
        console.log("Bad request. O token, idObjeto ou motivo é inválido.");
        return response.status(404).send("Bad request.");
    }

    //verifica se o token é válido
    return admin.auth().verifyIdToken(token).then(decodedToken => {

        //dados do usuário
        const uid = decodedToken.uid;
        const emailVerificado = decodedToken.email_verified;
        const email = decodedToken.email;

        //verifica se o email do usuário é verificado
        if (!emailVerificado) {
            console.log("Email not verified. O e-mail do usuário não está verificado.");
            return response.status(401).send("Email not verified.");
        }

        const objetoRef = firestore.collection('objetos').doc(idObjeto);
        const reportRef = firestore.collection('andamento');

        //pega as informações do objeto
        return objetoRef.get().then(doc => {
            if (!doc.exists) { //verifica se o objeto existe
                console.log("Object not found! O objeto não foi encontrado.");
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
                idAndamento: reportDocRef.id
            }).then(() => {
                return response.status(200).send("OK!");
            }).catch(error => {
                console.log(error);
                console.log("An error occurred. Ocorreu um erro ao criar o objeto.");
                return response.status(500).send("An error occurred.");
            });
        });

    }).catch(() => {
        //envia a response como erro (token inválido)
        console.log("Unauthorized. O token é inválido.");
        return response.status(401).send("Unauthorized.");
    });
});