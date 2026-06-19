import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  AppBar,
  Autocomplete,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Card,
  CardContent,
  TextField,
  Stack,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { apiFetch } from '../api';
import { SuccessDialog } from "./SuccessDialog";

function DepotFichier(){
  const navigate = useNavigate();
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Definition des etats
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 

  const [selectedNumInstrument, setSelectedNumInstrument] = useState<string>(''); //num_instrument
  const [selectedNomInstrument, setSelectedNomInstrument] = useState<string>(''); // nom_outil
  const [numInstrumentDisabled, setNumInstrumentDisabled] = useState(true);
  //const [instruments, setInstrumentsDisponibles] = useState<any[]>([]); //liste dinstruments disponibles sur la BDD
  const [nomsInstruments, setNomsInstruments] = useState<any[]>([]);
  const [numsInstrumentsParNoms, setNumsInstrumentsParNoms] = useState<Record<string, string[]>>({});
  const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);

  const [selectedResponsable,setSelectedResponsable] = useState<string>('');
  const [selectedEncadrant,setSelectedEncadrant] = useState<string>('');
  const [inputValueEncadrant, setInputValueEncadrant] = useState("");
  const [responsables, setResponsablesDisponibles] = useState<any[]>([]);
  const [personnesPasResponsables, setPersonnesPasResponsables] = useState<any[]>([]); 
  const [personnes, setPersonnes] = useState<any[]>([]); 

  //const [isNewResponsable, setIsNewResponsable] = useState<boolean>(false);//Check si le responsable fichier fut cree pour cet ajout
  const [showCreationRespInputs, setShowCreationRespInputs] = useState<boolean>(false);
  const [finVerifMail, setFinVerifMail] = useState<boolean>(false);
  const [estDejaPersonne, setEstDejaPersonne] = useState<boolean>(true);
  const [responsableCree, setResponsableCree] = useState<boolean>(false);
  const [formulaireEnvoye, setFormulaireEnvoye] = useState<boolean>(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const [nom, setNom] = useState<string>('');
  const [prenom, setPrenom] = useState<string>('');
  const [mail, setMail] = useState<string>('');
  const [fonction, setFonction] = useState<string>('');
  const [extension, setExtension] = useState<string>('');
  const [dateCollecteComplete, setDateCollecteComplete] = useState<string>('');
  const [commentaire, setCommentaire] = useState<string>('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cheminSelectedFile , setCheminSelectedFile] = useState<string>('');


  const FirstFormComplete = selectedNomInstrument !== '' && selectedNumInstrument !== '';
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
FetchData
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 
const fetchData = async () => {
            console.log("début du fetch data")
            try {

                const instrumentsRes = await apiFetch('/api/instruments');
                const instrumentsData = await instrumentsRes.json()

                const nomsI = Array.from(
                  new Set(instrumentsData.map((i : { nom_outil: string }) => i.nom_outil))
                  )
                console.log("Noms des instruments récupérés :", nomsI)
                setNomsInstruments(nomsI)

                const instrumentsParNom = instrumentsData.reduce(
                  (
                    dico: Record<string, string[]>,
                    instrument: any
                  ) => {
                    if (!dico[instrument.nom_outil]) {
                      dico[instrument.nom_outil] = [];
                    }
                
                    dico[instrument.nom_outil].push(instrument.num_instrument);
                
                    return dico;
                  },
                  {} as Record<string, number[]>
                );
                console.log("Tous les numéro instruments par instrument :", instrumentsParNom)
                setNumsInstrumentsParNoms(instrumentsParNom)


                const responsablesRes = await apiFetch('/api/responsables')
                const responsablesData = await responsablesRes.json()
                console.log("Responsables reçus du backend:", responsablesData)
                setResponsablesDisponibles(responsablesData || [])

                const personnesPasRespoRes = await apiFetch('/api/personnesPasRespo');
                const personnesPasRespoData = await personnesPasRespoRes.json()
                console.log("Personnes non responsables de fichier reçus du backend:", personnesPasRespoData)
                setPersonnesPasResponsables(personnesPasRespoData || [])

                const personnesRes = await apiFetch('/api/personnes');
                const personnesData = await personnesRes.json()
                console.log("Personnes reçus du backend:", personnesData)
                setPersonnes(personnesData || [])


            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
            }
        }
        //Effectue le call a fetch data une seule fois en page load
useEffect(() => {
        fetchData();
    }, [])

/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Definition des fonctions
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 

  const NomInstrumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedNomInstrument(event.target.value || ''); // Store nom_outil
    
    // Libérer le select suivant et le vider
    setNumInstrumentDisabled(false);
    setSelectedNumInstrument('');

    // Enlever les champs d'en bas si la personne change d'intrument
    setShowAdditionalInputs(false);
    setSelectedFile(null);
    setCommentaire('');
    setSelectedResponsable('');
  };

  //Gestion du changement d instrument
  const NumInstrumentChange = (event: SelectChangeEvent<string>) => {
    setSelectedNumInstrument(event.target.value || '');

    // Enlever les champs d'en bas si la personne change d'intrument
    setShowAdditionalInputs(false);
    setSelectedFile(null);
    setCommentaire('');
    setSelectedResponsable('');
  };

  const FileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .xlsx, .xls, .jp2, .wav';
    fileInput.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];

        // envoyer le file au back end
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await apiFetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
          
      if (response.ok) {
        const result = await response.json();
        console.log('Upload success:', result);

        //Verification avant de passer au reste du FORM
        const verificationResult = await sendInstrumentInfo(
            selectedNomInstrument, 
            selectedNumInstrument, 
            result.file.path
          ); //si reusite de verification, montrer le reste des inputs
        if (verificationResult && verificationResult.reussite === true) {
            setSelectedFile(file);
            setCheminSelectedFile(result.file.path);
            setShowAdditionalInputs(true);
            console.log('Verification passed:', verificationResult.commentaire);

          //Appel a la fonction d'autocompletion
          autocompletion(verificationResult);

      }else {
            //on ne montres pas le reste des inputs
            const errorMsg = verificationResult?.commentaire || 'Verification failed';
            alert(`Verification failed: ${errorMsg}`);
        }
      }
      else {
          alert('Erreur sauvegarde');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file');
        }
      }
    };  
    fileInput.click();
};
  //Gerer le changement de responsable
  const ResponsableChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    setSelectedResponsable(selectedValue);
  };

  const EncadrantChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    setSelectedEncadrant(selectedValue);
  };

  const retourCreationResponsable = () => {
    setShowCreationRespInputs(false)
    setNom('')
    setPrenom('')
    setMail('')
    setFonction('')
    setInputValueEncadrant('')
    setSelectedEncadrant('')
  }

const TodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const secondes = String(today.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${secondes}`;
};

const AutofillDate = () => {
  setDateCollecteComplete(TodayDate());
};

const clearChamps = () => {
  setNom('')
  setPrenom('')
  setFonction('')
  setInputValueEncadrant('')
  setSelectedEncadrant('')
};

const isValidEmail = (email: string) => {
  return /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+$/.test(email);
}

const verifMailPersonne = async () => {
  //Verifie si les entrees sont remplies
  if (!mail) {
    alert("Veuillez remplir le champs requis (mail)");
    return;
  }
  
  // Vérifier que c'est un mail valide !! 
  if (!isValidEmail(mail)) {
    alert("Adresse mail invalide");
    return;
  }


  try {
    const response = await apiFetch('/api/verifMailPersonne', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    mail: mail
    }),
  });

  if (response.ok) {
    const data = await response.json();
    
    if (data.estPresent){
      console.log("Mail appartient déjà à une personne.");
      setEstDejaPersonne(true)
      clearChamps()

      // Si la personne est déjà un responsable
      if (data.estDejaResponsable){
        alert("Le mail proposé appartient déjà à un responsable de fichiers.")
      }
      // Si la personne est dans la base mais pas en tant que responsable
      else{
        // Donner l'accès au bouton de création de responsable
        setFinVerifMail(true)
        setNom(data.nom_personne)
        setPrenom(data.prenom_personne)
        setFonction(data.fonction)

        if (data.aEncadrant){
          setInputValueEncadrant(data.prenom_encadrant + " " + data.nom_encadrant + " - " + data.mail_encadrant)
          setSelectedEncadrant(data.mail_encadrant)
        }
      }
    }
    else{
      setEstDejaPersonne(false)
      setFinVerifMail(true)
      clearChamps()
    }

    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message}`);
    }
    } catch (error) {
      console.error('Error:', error);
      alert("Erreur lors de la vérification du mail d'une potentielle personne");
    }
}

const handleCreateResponsable = async () => {
  //Verifie si les entrees sont remplies
  if (!nom || !prenom || !mail) {
    alert("Veuillez remplir tous les champs requis (nom, prénom, mail)");
    return;
  }

  try {
    const response = await apiFetch('/api/responsable_fichier', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    nom: nom,
    prenom: prenom,
    mail: mail,
    fonction: fonction,
    encadrant: selectedEncadrant,
    estDejaPersonne: estDejaPersonne
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Responsable fichier créé avec succès");
                  
    // recharger la liste des responsables fichiers disponibles dans la BDD
    fetchData();
                  
    // Cacher le form de création
    setShowCreationRespInputs(false);

    //Selection automatique du responsable cree
    setSelectedResponsable(data.mail);
    setResponsableCree(true)

    } else {
      const error = await response.json();
      if (error.message.includes("uq_personne_mail")){
        alert("L'adresse mail choisie est déjà utilisée pour un responsable de fichier.");
      }
      else{
        alert(`Erreur: ${error.message}`);
      }
    }
    } catch (error) {
      console.error('Error:', error);
      alert("Erreur lors de la création du responsable");
    }
  };

  //Evenement de Submit
  const Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFile) {
      console.log('Uploading file:', selectedFile.name)
    }
    else {
      console.log('No file selected')
      alert('Veuillez sélectionner un fichier')
      return
    }

    console.log("Mail responsable :", selectedResponsable)
    console.log("Nom instrument :", selectedNomInstrument)
    console.log("Num instrument :", selectedNumInstrument)
    // Vérifier que ça fonctionne dans tous les cas !!! (pas que en local)
    const resultat = "./" + cheminSelectedFile.substring(cheminSelectedFile.indexOf("server")).replace(/\\/g, "/");    
    /*console.log("Chemin fichier :", resultat)*/
    console.log("Commentaire :", commentaire)
    console.log("Date de collecte :", dateCollecteComplete)
    console.log("Extension :", extension)

    if (selectedFile){
      sendFormInfo(selectedNomInstrument, selectedNumInstrument, resultat, selectedResponsable, 
        commentaire, dateCollecteComplete, extension)
    }
  }

//////////////////////////////////Script de verification//////////////////////////////////////////////////
  const sendInstrumentInfo = async (nom_outil: string, num_instrument: string, filePath: string) => {
    
    try {
      {/*console.log(nom_outil,num_instrument);*/}
      const response = await apiFetch('/api/scriptVerif', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_outil: nom_outil,
          num_instrument: num_instrument,
          chemin_source: filePath
        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Script verification result:', data);
        return data;
      } else {
        console.error('Failed to run verification script'); 
        return null;
      }
    } catch (error) {
      console.error('Error running verification:', error);
      return null;
    }
  };

  //autocompletion des champs du form when verification ok
  const autocompletion = (verificationData: any) => {
  if (verificationData && verificationData.reussite === true) {
    // completion de Date de Collecte 
    if (verificationData.date_collecte) {
      //formattage de la date problemes avec le format du HOBO
      const dateStr = verificationData.date_collecte;
      if (!dateStr.includes(":")){ // Pour les TOMST 
        //setDateCollecteForm(dateStr)
        setDateCollecteComplete(dateStr + " 00:00:00")
        //console.log("Date collecte form :", dateStr)
        console.log("Date collecte complete :", dateStr + " 00:00:00")
      }
      else if (dateStr == ""){
        setDateCollecteComplete("")
      }
      else{ // Pour les Hobo
        //setDateCollecteForm(dateStr.split(" ")[0])
        setDateCollecteComplete(dateStr)
        //console.log("Date collecte form :", dateStr.split(" ")[0])
        console.log("Date collecte complete :", dateStr)
      }
    }
    else{
      setDateCollecteComplete("")
    }
    // completion Extension
    if (verificationData.extension) {
      setExtension(verificationData.extension);
    }
    else{
      setExtension("")
    }
    
    console.log('Form autocompleté avec le JSON de verification SUCCESS');
  }
};
//////////////////////////////////Script de verification//////////////////////////////////////////////////

//////////////////////////////////Script d'integration//////////////////////////////////////////////////
const sendFormInfo = async (nom_outil: string, num_instrument: string, filePath: string, mail_responsable: string, 
  commentaire: string, date_collecte: string, extension :string) => {

  setFormulaireEnvoye(true);

    try {
      const response = await apiFetch('/api/scriptInte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chemin_source: filePath,
          nom_outil: nom_outil,
          num_instrument: num_instrument,

          extension : extension,
          date_collecte : date_collecte,
          date_import: TodayDate(),
          commentaire: commentaire,

          mail_responsable : mail_responsable
        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Script integration result:', data);
        // REDIRECTION
        if (data.reussite){
          setSuccessOpen(true);
        }
        return data;
      } else {
        console.error('Failed to run integration script');
        setFormulaireEnvoye(false); 
        return null;
      }
    } catch (error) {
      console.error('Error running integration:', error);
      setFormulaireEnvoye(false);
      return null;
    }
  };
//////////////////////////////////Script d'integration//////////////////////////////////////////////////


/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
REACT
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 
return(
      <Box sx={{ flexGrow: 1 }}>                         
        <AppBar position="static" sx={{ bgcolor: "#EC9706" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>DEPOT DE FICHIER</Typography>
            <Button color="inherit" onClick={() => navigate('/')}>Menu</Button>
            <Button color="inherit" onClick={() => navigate('/ajout')}>Retour</Button>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth='md' sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                <center><b>DÉPÔT DE FICHIER</b></center>
                <br/>
                </Typography>

            <form onSubmit={Submit}>
              <Stack spacing={3}>

              <FormControl fullWidth required>
              <InputLabel>Sélectionnez le type d'instrument pour lequel vous souhaitez déposer un fichier</InputLabel>
              <Select
                value={selectedNomInstrument?.toString() || ''} 
                onChange={NomInstrumentChange}
                label="Sélectionnez le type d'instrument pour lequel vous souhaitez déposer un fichier"
              >
                {nomsInstruments.slice().sort().map((nom_instru) => (
                  <MenuItem 
                    key={nom_instru} 
                    value={nom_instru}
                  >
                    {nom_instru}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

              <FormControl fullWidth required>
              <InputLabel>Sélectionnez le numéro de cet instrument</InputLabel>
              <Select
                value={selectedNumInstrument?.toString() || ''} 
                onChange={NumInstrumentChange}
                label="Sélectionnez le numéro de cet instrument"
                disabled={numInstrumentDisabled}
              >
                {(numsInstrumentsParNoms[selectedNomInstrument] ?? []).slice().sort().map(num_instrument => (
                  <MenuItem 
                    key={num_instrument} 
                    value={num_instrument}
                  >
                    {num_instrument}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

              <Button
                  type="button"
                  variant="contained"
                  onClick={FileUpload}
                  disabled = {!FirstFormComplete}
                  sx={{
                    bgcolor: '#EC9706',
                    '&:hover': { bgcolor: '#C78023' },
                  }}
                >
                  SÉLECTION DE FICHIER
                </Button>

                {selectedFile && (
                  <Typography variant="body2" sx={{ color: 'green', textAlign: 'center' }}>
                  Fichier sélectionné: {selectedFile.name}
                  </Typography>
                )}

                {showAdditionalInputs && (
                  <>

                    <FormControl fullWidth required>
                        <InputLabel>Sélectionnez le Responsable du fichier</InputLabel>
                        <Select
                            value={selectedResponsable}
                            id="responsableID" 
                            onChange={ResponsableChange}
                            disabled={showCreationRespInputs}
                            required
                            label="Sélectionnez le Responsable du fichier"
                        >
                            {responsables.slice() // évite de modifier le tableau d'origine
                                .sort((a, b) => {
                                  const nom = a.nom.localeCompare(b.nom);
                          
                                  return nom !== 0
                                      ? nom
                                      : a.prenom.localeCompare(b.prenom);
                                }).map((responsable) => (
                                <MenuItem 
                                    key={responsable.id_personne} 
                                    value={responsable.adresse_mail}
                                >
                                    {responsable.prenom} {responsable.nom} - {responsable.adresse_mail}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    {responsableCree && (
                      <Typography variant="body2" sx={{ color: 'green', textAlign: 'center' }}>
                      Le responsable de fichier de mail {mail} a bien été créé.
                      </Typography>
                    )}

                    <Button
                    type="button"
                    variant="outlined"
                    onClick={(e) => {
                      setShowCreationRespInputs(true)
                      setEstDejaPersonne(true)
                      setFinVerifMail(false)
                      setResponsableCree(false)
                      clearChamps()
                      setMail('');
                    }}
                    sx={{ minWidth: '100px', height: '56px' }}
                    >
                    Créer nouveau responsable fichier  
                    </Button>
                    
                   {showCreationRespInputs &&(
                    <>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                      <Autocomplete
                        fullWidth
                        options={personnesPasResponsables
                          .slice()
                          .sort((a, b) => a.adresse_mail.localeCompare(b.adresse_mail))
                          .map((p) => p.adresse_mail)}
                        value={mail}
                        onInputChange={(_, newValue) => {
                          setMail(newValue)
                          clearChamps()
                          setFinVerifMail(false)
                          setEstDejaPersonne(true)
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Adresse mail"
                            variant="outlined"
                            fullWidth
                            required
                            placeholder="Entrez votre mail"
                          />
                        )}
                      />
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={verifMailPersonne}
                        sx={{ minWidth: '100px', height: '56px' }}
                        >
                        Vérifier
                      </Button>
                    </Stack>

                    <TextField
                        label="Prénom"
                        variant="outlined"
                        fullWidth
                        required
                        disabled={estDejaPersonne}
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        placeholder="Entrez votre prénom"
                      />
                    <TextField
                        label="Nom"
                      variant="outlined"
                      fullWidth
                      required
                      disabled={estDejaPersonne}
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Entrez votre nom"
                      />
                    <TextField
                      label="Fonction"
                      variant="outlined"
                      fullWidth
                      disabled={estDejaPersonne}
                      value={fonction}
                      onChange={(e) => setFonction(e.target.value)}
                      placeholder="Entrez votre fonction"
                    />
                    <Autocomplete
                      disabled={estDejaPersonne}
                      options={personnes}
                      getOptionLabel={(option) =>
                        typeof option === "string"
                          ? option
                          : `${option.prenom} ${option.nom} - ${option.adresse_mail}`
                      }
                      inputValue={inputValueEncadrant}
                      onInputChange={(_, newValue) => {
                        setInputValueEncadrant(newValue);
                        //setSelectedEncadrant(newValue.split(" - ")[1] ?? "");
                        //console.log("Encadrant :", selectedEncadrant)
                      }}
                      onChange={(_, value) => {
                        if (value && typeof value !== "string") {
                          setSelectedEncadrant(value.adresse_mail);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Encadrant"
                          variant="outlined"
                          fullWidth
                          placeholder="Sélectionnez votre encadrant"
                        />
                      )}
                    />
                    

                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                      <Button
                          type="button"
                          variant="outlined"
                          disabled={!finVerifMail}
                          onClick={handleCreateResponsable}
                          sx={{ minWidth: '100px', height: '56px' }}
                        >
                          Créer
                        </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={retourCreationResponsable}
                        sx={{ minWidth: '100px', height: '56px' }}
                        >
                        Retour
                      </Button>
                    </Stack>

                    </>
                    )}
                    
                  <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Date de collecte"
                        type="datetime-local"
                        variant="outlined"
                        id='date_collecte'
                        fullWidth
                        required
                        value={dateCollecteComplete}
                        onChange={(e) => setDateCollecteComplete(e.target.value.replace("T", " "))}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          step: 1, // autorise les secondes
                        }}
                      />
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={AutofillDate}
                        sx={{ minWidth: '100px', height: '56px' }}
                        >
                        Aujourd'hui
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Format (extension)"
                        variant="outlined"
                        id="extension"
                        fullWidth
                        required
                        value={extension}
                        onChange={(e) => setExtension(e.target.value)}
                        placeholder="Extension du fichier"
                      />
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Commentaire"
                        variant="outlined"
                        id="commentaire"
                        fullWidth
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        placeholder="Commentaire sur le fichier"
                      />
                    </Stack>
                  
                  </>
                )}
              
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!FirstFormComplete || !selectedFile}
                  loading={formulaireEnvoye}
                  sx={{
                    bgcolor: (FirstFormComplete && selectedFile) ? '#EC9706' : '#CCCCCC',
                    '&:hover': {
                      bgcolor: (FirstFormComplete && selectedFile) ? '#C78023' : '#CCCCCC',
                    },
                  }}
                >
                  Déposer
                </Button>

                <SuccessDialog
                  open={successOpen}
                  titre={"Intégration réussie"}
                  message={"Toutes les mesures ont pu être intégrées avec succés."}
                  nomBoutonRestart={"Nouvelle intégration"}
                  onStay={() => window.location.reload()}
                  onGoHome={() => navigate("/")}
                />
  
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    );
}

export default DepotFichier;