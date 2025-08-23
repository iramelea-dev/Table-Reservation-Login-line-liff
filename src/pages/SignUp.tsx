import { CheckboxCustomEvent, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonSearchbar, IonText, IonTitle, IonToolbar } from "@ionic/react"
import "./css/SignUp.css"
import { useRef, useState, useEffect } from "react";
import { ItemProvince } from "./types";
import { t } from "i18next";
import liff from "@line/liff";
import { register } from "../Api/action";

liff.init({
  liffId: "2007954701-MkOzvaX5", 
});

const SignUp=()=>{
    const [selectedProvinceText, setSelectProvinceText] = useState<string>('');
    const [selectedProvince, setSelectProvince] = useState<string[]>([]);
    const [modalProvince , setModalProvince] = useState(false)
    const [profileurl  ,setProfileUrl] = useState<any>()


    const provinces = [
        {  id:1 ,  value:"001" ,	  label:"กรุงเทพมหานคร" ,  OFF_DESC_TH:"กท" , },
        {  id:2 ,  value:"100" ,	  label:"ชัยนาท" ,  OFF_DESC_TH:"ชน" },
    ]

    const Sumbit =async () => {
      const result = await register({
        name: "m_name",
        contactPhone: "m_contact_phone",
        province: "m_province"
      })
      console.log(result)
    }
    const modal = useRef<HTMLIonModalElement>(null);
useEffect(() => {
    const initlineliff = async () => {
      try {
        liff.init({
          liffId: "2007954701-MkOzvaX5",
        }).then(async () => {
          if (!liff.isLoggedIn()) { await liff.login() }
          const lineprofile = await liff.getProfile()
          setProfileUrl(lineprofile.pictureUrl)
          console.log(lineprofile)

        }).catch((error) => { alert(JSON.stringify(error)) })



        // if (!liff.isLoggedIn()) { await liff.login() }
        // const lineprofile = await liff.getProfile()
        // setProfileUrl(lineprofile.pictureUrl)

        // console.log(lineprofile)
      }
      catch (error) {
        alert(JSON.stringify(error))
      }
    }
    initlineliff()
  }, [])
    const formatData = (data: string[]) => {
        console.log("data  ",data)
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
                        <select value={selectedProvinceText} >
                            { provinces && provinces?.map((p)=> <option  value={p?.value}> {p.label} </option> )  }
                        </select> 
                    </IonLabel> 
                    <br/>
                    <br/>
                    <IonCheckbox labelPlacement="end" >
                        <IonLabel style={{fontSize:".9em"}}>{t("form_agree")}</IonLabel>
                    </IonCheckbox> <br/> <br/>
                    <IonButton onClick={Sumbit} expand="block" > 
                        <IonLabel>{t("form_register")}</IonLabel>
                    </IonButton> 
                </form>
                    <img src="../../assets/images/pint-factory-purple.png" style={{height:"12rem"}} />
            </div>
        </IonContent>
        <IonModal trigger="select-fruits"  ref={modal} isOpen={modalProvince}  initialBreakpoint={.8} onIonModalDidDismiss={()=>{setModalProvince(false)}} >
            <AppTypeahead
                title="Favorite Fruits"
                items={provinces}
                selectedItems={selectedProvince}
                onSelectionCancel={() => modal.current?.dismiss()}
                onSelectionChange={provinceChange}
            />
      </IonModal>
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