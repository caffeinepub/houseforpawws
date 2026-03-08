import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

module {
  public type OldUserProfile = {
    displayName : Text;
    bio : Text;
    location : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  public type OldPet = {
    id : Text;
    name : Text;
    species : Text;
    breed : Text;
    age : Text;
    size : Text;
    description : Text;
    healthStatus : Text;
    tags : [Text];
    location : Text;
    photoBlobs : [Storage.ExternalBlob];
    isAdopted : Bool;
    ownerId : Principal;
  };

  public type OldMessage = {
    sender : Principal;
    text : Text;
    timestamp : Int;
  };

  public type OldPetStore = {
    petIdCounter : Nat;
    pets : Map.Map<Text, OldPet>;
  };

  public type OldConversation = {
    id : Text;
    user1 : Principal;
    user2 : Principal;
    messages : List.List<OldMessage>;
  };

  public type OldActor = {
    petStore : OldPetStore;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    conversations : Map.Map<Text, OldConversation>;
    accessControlState : AccessControl.AccessControlState;
  };

  public type NewPet = OldPet;
  public type NewMessage = OldMessage;
  public type NewPetStore = OldPetStore;

  public type NewUserProfile = {
    displayName : Text;
    bio : Text;
    location : Text;
    profilePhoto : ?Storage.ExternalBlob;
    email : Text;
    phone : Text;
  };

  public type NewConversation = OldConversation;
  public type NewActor = {
    petStore : NewPetStore;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    conversations : Map.Map<Text, NewConversation>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      userProfiles = old.userProfiles.map(
        func(_principal, profile) {
          {
            profile with
            email = "";
            phone = "";
          };
        }
      )
    };
  };
};
