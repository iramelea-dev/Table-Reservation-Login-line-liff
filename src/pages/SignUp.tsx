import { CheckboxCustomEvent, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonSearchbar, IonText, IonTitle, IonToolbar } from "@ionic/react"
import "./css/SignUp.css"
import { useRef, useState, useEffect } from "react";
import { ItemProvince } from "./types";
import { t } from "i18next";
import liff from "@line/liff";
import { register } from "../Api/service";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import provincesData from "../province/province.json"
import axios from "axios";

const SignUp = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [provinces, setProvinces] = useState<{ id: Number; value: string, label: string, off_desc_th: string }[]>([]);
  const [selectedProvinceText, setSelectProvinceText] = useState<string>('');
  const [selectedProvince, setSelectProvince] = useState<string[]>([]);
  const [modalProvince, setModalProvince] = useState(false)
  const [profileurl, setProfileUrl] = useState<any>()
  const [agree, setAgree] = useState(false);
  const [profile, setProfile] = useState<any>();


  // const provincesz = [
  //   { id: 1, value: "กรุงเทพมหานคร", label: "กรุงเทพมหานคร", OFF_DESC_TH: "กท", },
  //   { id: 2, value: "ชัยนาท", label: "ชัยนาท", OFF_DESC_TH: "ชน" },
  // ]

  // const takePicture = async () => {
  //   const image = await Camera.getPhoto({
  //     quality: 60,
  //     allowEditing: true,
  //     resultType: CameraResultType.Base64
  //   });
  //   const base64Data = image.base64String!;
  //   const contentType = image.format === 'png' ? 'image/png' : 'image/jpeg';
  //   const byteCharacters = atob(base64Data);
  //   const byteArrays = [];

  //   for
  // }

  const Submit = async () => {
  if (!profile) {
    alert("Profile Not Found");
    return;
  }

  const payload = {
    name: name || profile.displayName,
    contactPhone: phone,
    province: province,
    lineid: profile.userId,
  };

  console.log("📦 JSON ที่จะส่ง:", JSON.stringify(payload, null, 2));

  try {
    const result = await register(payload);
    console.log("✅ Response backend:", result.data);
  } catch (error) {
    console.error("❌ Error backend:", error);
  }
};
  const handleupload = async (userId: string) => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        quality: 70,
      });
      const res = await axios.post(
        "http://localhost:8080/do/uploadImage"
        , {
          userId,
          imageBase64: photo.base64String,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Upload suscues", res.data);
    } catch (err) {
      console.error("Upload Fail", err)
    }
  };
  const modal = useRef<HTMLIonModalElement>(null);

  useEffect(() => {
    setProvinces(provincesData)
    const initLiff = async () => {
      try {
        await liff.init({ liffId: "2007954701-MkOzvaX5" });
        if (!liff.isLoggedIn()) {
          liff.login(); // redirect 
          return;
        }
        const lineProfile = await liff.getProfile();
        setProfile(lineProfile);
        console.log(lineProfile)
        setProfileUrl(lineProfile.pictureUrl)
        setName(lineProfile.displayName);
      } catch (error) {
        console.error("LIFF error:", error);
        alert("LIFF error: " + JSON.stringify(error));
      }
    };
    initLiff();
  }, []);
  // useEffect(() = > {
  //   setProvinces(provincesData);
  // }, []);

  const formatData = (data: string[]) => {
    console.log("data  ", data)
    if (data.length === 1) {
      const provn = provinces.find((provn) => provn.value === data[0])!;
      return provn.label;
    }

    return `${data.length} items`;
  };

  const provinceChange = (value: string) => {
    setProvince(value); // state  submit
    setSelectProvinceText(formatData([value])); //  label
    modal.current?.dismiss();
  };


  // const provinceChange = (province: string[]) => {
  //   console.log("province ", province)
  //   setSelectProvince(province);
  //   setSelectProvinceText(formatData(province));
  //   modal.current?.dismiss();
  // };

  return (
    <IonPage>
      <IonHeader className="ion-no-border" mode="ios"  ></IonHeader>
      <IonContent className="ion-padding" >
        <div className="form-signup">
          <h3 className="title" >{t("signup")}</h3>
          <form className="ion-text-left ion-padding" >
            <div>
              <div className="profile">
                <div className="img-profile" style={{ backgroundImage: "url(" + profileurl + ")", }} ></div>
              </div>
            </div>
            <IonLabel className="input-name" >
              <IonText>{t("form_name")}</IonText>
              <IonInput value={name} onIonChange={(e) => setName(e.detail.value!)}
                mode="ios" placeholder={t("form_enter_placeholder")} type="text" ></IonInput>
            </IonLabel>

            <IonLabel className="input-name" >
              <IonText>{t("form_phonenumber")}</IonText>
              <IonInput value={phone} onIonChange={(e) => setPhone(e.detail.value!)} mode="ios" placeholder={"090-000000"} type="tel"></IonInput>
            </IonLabel>

            <IonLabel className="input-name" >
              <IonText>{t("form_province")}</IonText>
              {/* <IonInput mode="ios" placeholder="Province" value={selectedProvinceText} onClick={()=>{setModalProvince(true)}} ></IonInput> */}
              <select value={province}
                onChange={(e) => { setProvince(e.target.value); console.log(province) }} >
                {provinces && provinces?.map((p) => <option value={p?.value}> {p.label} </option>)}
              </select>
            </IonLabel>
            <br />
            <br />
            <IonCheckbox
              checked={agree}
              onIonChange={(e) => {
                const value = e.detail.checked;
                console.log("Checkbox value:", value);
                setAgree(value);
              }}
              labelPlacement="end">
              <IonLabel style={{ fontSize: ".9em" }}>{t("form_agree")}</IonLabel>
            </IonCheckbox> <br /> <br />

            <IonButton onClick={Submit} expand="block" >
              <IonLabel>{t("form_register")}</IonLabel>
            </IonButton>
          </form>
          <img src="../../assets/images/pint-factory-purple.png" style={{ height: "12rem" }} />
        </div>
      </IonContent>

    </IonPage>
  )
}

export default SignUp;




interface TypeaheadProps {
  items: ItemProvince[];
  selectedItems: any;
  title?: string;
  onSelectionCancel?: () => void;
  onSelectionChange?: (items: any) => void;
}

function AppTypeahead(props: TypeaheadProps) {
  const [filteredItems, setFilteredItems] = useState<ItemProvince[]>([...props.items]);
  const [workingSelectedValues, setWorkingSelectedValues] = useState<string>("");

  const isChecked = (value: string) => {
    // return workingSelectedValues.find((item) => item === value) !== undefined;
    return workingSelectedValues?.match(value) ? true : false
  };

  const cancelChanges = () => {
    const { onSelectionCancel } = props;
    if (onSelectionCancel !== undefined) {
      onSelectionCancel();
    }
  };

  const confirmChanges = () => {
    const { onSelectionChange } = props;
    if (onSelectionChange !== undefined) {
      onSelectionChange(workingSelectedValues);
    }
  };

  const searchbarInput = (event: any) => {
    filterList(event.target.value);
  };

  /**
   * Update the rendered view with
   * the provided search query. If no
   * query is provided, all data
   * will be rendered.
   */
  const filterList = (searchQuery: string | null | undefined) => {
    /**
     * If no search query is defined,
     * return all options.
     */
    if (searchQuery === undefined || searchQuery === null) {
      setFilteredItems([...props.items]);
    } else {
      /**
       * Otherwise, normalize the search
       * query and check to see which items
       * contain the search query as a substring.
       */
      const normalizedQuery = searchQuery.toLowerCase();
      setFilteredItems(
        props.items.filter((item) => {
          return item.label.toLowerCase().includes(normalizedQuery);
        })
      );
    }
  };

  const checkboxChange = (event: CheckboxCustomEvent, item: any) => {
    const { checked, value } = event.detail;
    console.log("workingSelectedValues ", workingSelectedValues)
    if (checked) {
      setWorkingSelectedValues(value);
    } else {
      setWorkingSelectedValues(value);
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={cancelChanges}>Cancel</IonButton>
          </IonButtons>
          <IonTitle>{props.title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={confirmChanges}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar onIonInput={searchbarInput}></IonSearchbar>
        </IonToolbar>
      </IonHeader>

      <IonContent color="light" class="ion-padding">
        <IonList id="modal-list" inset={true}>
          {filteredItems.map((item) => (
            <IonItem key={item.label}>
              <IonCheckbox value={item.value} checked={isChecked(item.label)} onIonChange={(e) => checkboxChange(e, item)}>
                {item.label}
              </IonCheckbox>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </>
  );
}